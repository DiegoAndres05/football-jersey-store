"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffUser } from "@/features/auth/server/session";
import { isStaffRole } from "@/features/auth/domain/staff-role";
import {
  cashCounterEmail,
  cashSaleHasStock,
  cashSaleMovementQuantity,
  quoteCashSale,
  shouldPersistCashSale,
} from "@/features/orders/domain/cash-sale";

const cashSaleSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().max(30).optional().default(""),
  idempotencyKey: z.string().trim().min(8).max(80),
  lines: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().positive().max(20),
  })).min(1).max(20),
});

function cashCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i = 0; i < 6; i += 1) rand += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `FS-${y}-${m}-${rand}`;
}

export async function confirmCashSaleAction(input: unknown): Promise<{ error: string } | { ok: true; code: string }> {
  const actor = await getStaffUser();
  if (!actor || !isStaffRole(actor.role)) return { error: "No autorizado." };
  const parsed = cashSaleSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa el nombre y las prendas de la venta." };

  const paymentRef = `cash:${parsed.data.idempotencyKey}`;
  const existing = await prisma.order.findFirst({
    where: { paymentMethod: "CASH", paymentRef },
    select: { code: true },
  });
  if (!shouldPersistCashSale(existing?.code ?? null) && existing) {
    return { ok: true, code: existing.code };
  }

  const variantIds = [...new Set(parsed.data.lines.map((line) => line.variantId))];
  try {
    const code = await prisma.$transaction(async (tx) => {
      const replay = await tx.order.findFirst({
        where: { paymentMethod: "CASH", paymentRef },
        select: { code: true },
      });
      if (replay) return replay.code;

      await tx.$queryRaw`
        SELECT "id" FROM "ProductVariant"
        WHERE "id" IN (${Prisma.join(variantIds)})
        FOR UPDATE
      `;
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          product: { select: { id: true, name: true, team: { select: { name: true } } } },
          version: { select: { name: true } },
          size: { select: { name: true } },
        },
      });
      if (variants.length !== variantIds.length) throw new Error("MISSING_VARIANT");
      const byId = new Map(variants.map((variant) => [variant.id, variant]));
      const stockRows = await tx.inventoryMovement.groupBy({
        by: ["variantId"],
        where: { variantId: { in: variantIds } },
        _sum: { quantity: true },
      });
      const stock = new Map(stockRows.map((row) => [row.variantId, row._sum.quantity ?? 0]));
      const priced = parsed.data.lines.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
        unitPrice: byId.get(line.variantId)?.salePrice ?? -1,
      }));
      if (!cashSaleHasStock(priced, stock)) throw new Error("NO_STOCK");
      const quote = quoteCashSale(priced);
      if (!quote.ok) throw new Error("BAD_QUOTE");

      const code = cashCode();
      const phone = parsed.data.customerPhone ?? "";
      const created = await tx.order.create({
        data: {
          code,
          status: "PAID",
          paidAt: new Date(),
          customerName: parsed.data.customerName,
          customerEmail: cashCounterEmail(code),
          customerPhone: phone,
          subtotal: quote.quote.subtotal,
          personalizationFee: 0,
          shippingFee: 0,
          discountAmount: 0,
          total: quote.quote.total,
          shippingMethod: "Retiro en tienda",
          shippingFullName: parsed.data.customerName,
          shippingPhone: phone,
          shippingLine1: "Mostrador",
          shippingCity: "Retiro en tienda",
          shippingState: "Retiro en tienda",
          shippingCountry: "Colombia",
          paymentMethod: "CASH",
          paymentRef,
          saleCurrency: "COP",
          items: {
            create: parsed.data.lines.map((line) => {
              const variant = byId.get(line.variantId)!;
              return {
                productId: variant.product.id,
                variantId: variant.id,
                productName: variant.product.name,
                teamName: variant.product.team?.name ?? "",
                versionName: variant.version.name,
                sizeName: variant.size.name,
                unitPrice: variant.salePrice,
                quantity: line.quantity,
                subtotal: variant.salePrice * line.quantity,
                deliveryMode: "INMEDIATA",
              };
            }),
          },
          history: {
            create: {
              toStatus: "PAID",
              note: "Venta en efectivo en tienda.",
              createdBy: actor.id,
            },
          },
        },
      });
      await tx.inventoryMovement.createMany({
        data: parsed.data.lines.map((line) => ({
          variantId: line.variantId,
          type: "SALE",
          quantity: cashSaleMovementQuantity(line.quantity),
          reference: created.code,
          reason: "Venta en efectivo en tienda.",
          orderReference: created.code,
          userReference: actor.email,
        })),
      });
      return created.code;
    });
    return { ok: true, code };
  } catch (error) {
    if (error instanceof Error && error.message === "NO_STOCK") {
      return { error: "No hay stock suficiente para esa cantidad." };
    }
    return { error: "No pudimos registrar la venta. Intenta de nuevo." };
  }
}
