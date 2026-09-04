import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { shippingFee } from "@/shared/config/site";
import {
  checkoutFormSchema,
  type PaymentMethod,
} from "@/features/checkout/schemas/checkout-schema";
import type { DeliveryMode } from "@/features/products/types/delivery-mode";
import { planInventoryMovements } from "./inventory-plan";
import { getCurrencyContext } from "@/shared/money/server-helpers";

export type OrderLineInput = {
  variantId: string;
  quantity: number;
  customizationType: "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";
  customizationName: string;
  customizationNumber: string;
  deliveryMode: DeliveryMode;
};

export type CreateOrderInput = {
  form: z.infer<typeof checkoutFormSchema>;
  lines: OrderLineInput[];
  paymentMethod: PaymentMethod;
  paymentReference: string;
};

function orderCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FS-${y}-${m}-${rand}`;
}

/**
 * Crea el pedido con precios recalculados desde la base de datos
 * (nunca se confía en los valores enviados por el cliente), genera
 * los movimientos de inventario (RESERVATION) y deja el historial.
 * El pago queda como "PENDING_PAYMENT": la pasarela es una simulación.
 */
export async function createOrder(input: CreateOrderInput): Promise<
  { ok: true; code: string } | { ok: false; error: string }
> {
  const parsed = checkoutFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return { ok: false, error: "Datos de envío inválidos." };
  }
  if (input.lines.length === 0) {
    return { ok: false, error: "El carrito está vacío." };
  }

  const variantIds = [...new Set(input.lines.map((l) => l.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      version: true,
      size: true,
      product: { select: { name: true, team: { select: { name: true } }, customizationsEnabled: true, customizationSurcharge: true, id: true } },
    },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));

  let subtotal = 0;
  let personalizationFee = 0;
  const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

  for (const line of input.lines) {
    const variant = variantById.get(line.variantId);
    if (!variant || line.quantity < 1) {
      return { ok: false, error: "Un artículo del carrito ya no está disponible." };
    }
    if (line.deliveryMode !== "INMEDIATA" && line.deliveryMode !== "BAJO_PEDIDO") {
      return { ok: false, error: "Modalidad de entrega inválida." };
    }
    const surcharge =
      line.customizationType !== "NONE" && variant.product.customizationsEnabled
        ? variant.product.customizationSurcharge
        : 0;
    const unitPrice = variant.salePrice + surcharge;
    const lineSubtotal = unitPrice * line.quantity;
    subtotal += lineSubtotal;
    personalizationFee += surcharge * line.quantity;
    orderItems.push({
      productId: variant.productId,
      variantId: variant.id,
      productName: variant.product.name,
      teamName: variant.product.team.name,
      versionName: variant.version.name,
      sizeName: variant.size.name,
      unitPrice,
      quantity: line.quantity,
      subtotal: lineSubtotal,
      customizationType: line.customizationType,
      customizationName: line.customizationName || null,
      customizationNumber: line.customizationNumber || null,
      officialPlayer:
        line.customizationType === "OFFICIAL_PLAYER" ? line.customizationName || null : null,
      deliveryMode: line.deliveryMode,
    });
  }

  const fee = shippingFee(subtotal);
  const total = subtotal + fee;
  const f = parsed.data;
  const code = orderCode();

  const currencyCtx = await getCurrencyContext();
  const saleCurrency = currencyCtx.currency;
  const exchangeRateCopPerUsd = currencyCtx.currency === "USD" && currencyCtx.copPerUsd ? currencyCtx.copPerUsd : null;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Bloquea las variantes involucradas para serializar pedidos
      // concurrentes y evitar sobreventa en líneas de entrega inmediata.
      if (variantIds.length > 0) {
        await tx.$queryRaw`
          SELECT "id" FROM "ProductVariant"
          WHERE "id" IN (${Prisma.join(variantIds)})
          FOR UPDATE
        `;
      }

      const stockRows = await tx.inventoryMovement.groupBy({
        by: ["variantId"],
        where: { variantId: { in: variantIds } },
        _sum: { quantity: true },
      });
      const stockById = new Map(stockRows.map((r) => [r.variantId, r._sum.quantity ?? 0]));

      const plan = planInventoryMovements(input.lines, stockById);
      if (!plan.ok) throw new Error(`NO_STOCK:${plan.error}`);

      const existingCustomer = await tx.customer.findFirst({ where: { email: f.email } });
      const customer = existingCustomer
        ? await tx.customer.update({
            where: { id: existingCustomer.id },
            data: { name: f.fullName, phone: f.phone },
          })
        : await tx.customer.create({
            data: {
              email: f.email,
              name: f.fullName,
              phone: f.phone,
              addresses: {
                create: {
                  fullName: f.shippingFullName,
                  phone: f.shippingPhone,
                  line1: f.shippingLine1,
                  line2: f.shippingLine2 || null,
                  city: f.shippingCity,
                  state: f.shippingState,
                  zipCode: f.shippingZipCode || null,
                  isDefault: true,
                },
              },
            },
          });

      const created = await tx.order.create({
        data: {
          code,
          status: "PENDING_PAYMENT",
          customerId: customer.id,
          customerName: f.fullName,
          customerEmail: f.email,
          customerPhone: f.phone,
          subtotal,
          personalizationFee,
          shippingFee: fee,
          total,
          shippingMethod: "Nacional",
          shippingFullName: f.shippingFullName,
          shippingPhone: f.shippingPhone,
          shippingLine1: f.shippingLine1,
          shippingLine2: f.shippingLine2 || null,
          shippingCity: f.shippingCity,
          shippingState: f.shippingState,
          shippingZipCode: f.shippingZipCode || null,
          notes: f.notes || null,
          paymentMethod: input.paymentMethod,
          paymentRef: input.paymentReference,
          saleCurrency,
          exchangeRateCopPerUsd,
          items: { create: orderItems },
          history: {
            create: {
              toStatus: "PENDING_PAYMENT",
              note: "Pedido creado. Pago simulado (demo, sin pasarela conectada).",
              createdBy: input.paymentReference,
            },
          },
        },
      });

      await tx.inventoryMovement.createMany({
        data: plan.movements.map((m) => ({
          variantId: m.variantId,
          type: "RESERVATION",
          // El ledger computa stock como SUM(quantity): reservar resta existencias.
          // Solo las líneas INMEDIATA reservan; las de bajo pedido no tienen stock físico.
          quantity: m.quantity,
          reference: code,
          reason: "Reserva por pedido (pago simulado - demo).",
          orderReference: code,
          userReference: f.email,
        })),
      });

      return created;
    });

    return { ok: true, code: order.code };
  } catch (err) {
    const noStock = err instanceof Error && err.message.startsWith("NO_STOCK:");
    if (!noStock) console.error("createOrder failed:", err);
    return {
      ok: false,
      error: noStock && err instanceof Error
        ? err.message.slice("NO_STOCK:".length)
        : "No pudimos crear tu pedido. Intenta de nuevo.",
    };
  }
}

export async function getOrderByCode(code: string) {
  const order = await prisma.order.findUnique({
    where: { code },
    include: { items: true },
  });
  return order;
}