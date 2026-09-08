import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notifyOrderPaid } from "@/features/notifications/services/notification-service";
import type { BoldPaymentOutcome } from "@/features/payments/domain/bold-payment-outcome";
import {
  planReservationCancellations,
  shouldReleaseReservations,
} from "@/features/orders/repositories/inventory-plan";

/**
 * Source of the payment event — distinguishes webhook from confirmation reconcile
 * in audit history.
 */
export type BoldPaymentSource = "webhook" | "reconcile" | "return";

export type ApplyBoldPaymentInput = {
  orderCode: string;
  outcome: Extract<BoldPaymentOutcome, "APPROVED" | "REJECTED">;
  source: BoldPaymentSource;
  providerRef?: string;
  note?: string;
};

export type ApplyBoldPaymentResult =
  | { applied: true; toStatus: "PAID" | "PAYMENT_FAILED"; orderId: string }
  | { applied: false; reason: "NOT_FOUND" | "NOT_PENDING" | "NOOP" };

/**
 * Shared idempotent transition for Bold payment resolution.
 *
 * - Only acts when order is in `PENDING_PAYMENT`.
 * - APPROVED → PAID + paidAt + history + notifyOrderPaid (fire-and-forget).
 *   Inventory is unchanged (no SALE in this change).
 * - REJECTED → PAYMENT_FAILED + history + CANCELLATION rows that reverse
 *   this order's RESERVATION movements (same Prisma transaction).
 * - Already PAID / PAYMENT_FAILED / other → NOOP / NOT_PENDING (no inventory).
 */
export async function applyBoldPayment(
  input: ApplyBoldPaymentInput,
): Promise<ApplyBoldPaymentResult> {
  const { orderCode, outcome, source, providerRef, note } = input;

  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    select: { id: true, status: true },
  });

  if (!order) {
    return { applied: false, reason: "NOT_FOUND" };
  }

  if (order.status !== "PENDING_PAYMENT") {
    return { applied: false, reason: "NOT_PENDING" };
  }

  const toStatus = outcome === "APPROVED" ? "PAID" : "PAYMENT_FAILED";
  const createdBy = `bold-${source}:${providerRef ?? "unknown"}`;
  const defaultNote =
    outcome === "APPROVED"
      ? `Pago aprobado vía Bold ${source}.`
      : `Pago rechazado vía Bold ${source}.`;

  let applied = false;
  let productIdsToRevalidate: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${order.id} FOR UPDATE`;

      const current = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      if (!current || current.status !== "PENDING_PAYMENT") {
        return;
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: toStatus,
          ...(toStatus === "PAID" ? { paidAt: new Date() } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus,
          createdBy,
          note: note ?? defaultNote,
        },
      });

      if (outcome === "REJECTED") {
        const existingCancellationCount = await tx.inventoryMovement.count({
          where: { orderReference: orderCode, type: "CANCELLATION" },
        });

        if (
          shouldReleaseReservations({
            currentStatus: current.status,
            outcome,
            existingCancellationCount,
          })
        ) {
          const reservations = await tx.inventoryMovement.findMany({
            where: { orderReference: orderCode, type: "RESERVATION" },
            select: { variantId: true, quantity: true },
          });
          const cancellations = planReservationCancellations(reservations);
          if (cancellations.length > 0) {
            await tx.inventoryMovement.createMany({
              data: cancellations.map((m) => ({
                variantId: m.variantId,
                type: "CANCELLATION",
                quantity: m.quantity,
                reference: orderCode,
                orderReference: orderCode,
                reason: "Liberación de reserva por pago rechazado (Bold).",
              })),
            });
          }
        }

        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
          select: { productId: true },
        });
        productIdsToRevalidate = items
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id));
      }

      applied = true;
    });
  } catch (err) {
    console.error("[applyBoldPayment] Transaction failed:", err);
    return { applied: false, reason: "NOT_PENDING" };
  }

  if (!applied) {
    return { applied: false, reason: "NOT_PENDING" };
  }

  if (toStatus === "PAID") {
    void notifyOrderPaid(order.id).catch(() => undefined);
  }

  if (toStatus === "PAYMENT_FAILED") {
    try {
      await revalidateCatalogAfterRejectedPayment(productIdsToRevalidate);
    } catch (err) {
      console.error("[applyBoldPayment] catalog revalidate failed:", err);
    }
  }

  return { applied: true, toStatus, orderId: order.id };
}

async function revalidateCatalogAfterRejectedPayment(productIds: string[]) {
  revalidatePath("/productos");
  revalidatePath("/");

  if (productIds.length === 0) return;

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(productIds)] } },
    select: { slug: true },
  });
  for (const product of products) {
    revalidatePath(`/productos/${product.slug}`);
  }
}
