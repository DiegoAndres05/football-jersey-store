import "server-only";
import { prisma } from "@/lib/prisma";
import { notifyOrderPaid } from "@/features/notifications/services/notification-service";
import type { BoldPaymentOutcome } from "@/features/payments/domain/bold-payment-outcome";

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
 * - REJECTED → PAYMENT_FAILED + history.
 * - Already PAID or other state → NOOP / NOT_PENDING.
 * - Order not found → NOT_FOUND.
 *
 * Designed to be called from both webhook and confirmation reconcile.
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

  try {
    await prisma.$transaction(async (tx) => {
      // Re-check status inside transaction for concurrency safety
      const current = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      if (!current || current.status !== "PENDING_PAYMENT") {
        return; // another call already transitioned — no-op
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
    });
  } catch (err) {
    console.error("[applyBoldPayment] Transaction failed:", err);
    return { applied: false, reason: "NOT_PENDING" };
  }

  // Fire-and-forget notification for approved payments
  if (toStatus === "PAID") {
    void notifyOrderPaid(order.id).catch(() => undefined);
  }

  return { applied: true, toStatus, orderId: order.id };
}
