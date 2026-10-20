import "server-only";
import { prisma } from "@/lib/prisma";
import { notifyOrderPaid } from "@/features/notifications/services/notification-service";
import { sendPaidOrderEmail } from "@/features/notifications/services/order-paid-email";

export type ApplyPayPalPaymentResult =
  | { applied: true; orderId: string }
  | { applied: false; reason: "NOT_FOUND" | "NOT_PENDING" | "MISMATCH" };

/**
 * Marks a PayPal order paid after the capture was already checked against
 * the order snapshot. Only PENDING_PAYMENT + PAYPAL orders move to PAID.
 */
export async function applyPayPalPayment(input: {
  orderCode: string;
  paypalOrderId: string;
  captureId: string;
}): Promise<ApplyPayPalPaymentResult> {
  const order = await prisma.order.findUnique({
    where: { code: input.orderCode },
    select: { id: true, status: true, paymentMethod: true, paymentRef: true },
  });
  if (!order) return { applied: false, reason: "NOT_FOUND" };
  if (order.paymentMethod !== "PAYPAL" || order.paymentRef !== `paypal:${input.paypalOrderId}`) {
    return { applied: false, reason: "MISMATCH" };
  }
  if (order.status !== "PENDING_PAYMENT") return { applied: false, reason: "NOT_PENDING" };

  let applied = false;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${order.id} FOR UPDATE`;
      const current = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true, paymentMethod: true, paymentRef: true },
      });
      if (!current || current.status !== "PENDING_PAYMENT" || current.paymentMethod !== "PAYPAL" || current.paymentRef !== `paypal:${input.paypalOrderId}`) {
        return;
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      const usage = await tx.couponUsage.findFirst({
        where: { orderId: order.id, state: "RESERVED" },
      });
      if (usage) {
        await tx.couponUsage.update({
          where: { id: usage.id },
          data: { state: "CONFIRMED", confirmedAt: new Date() },
        });
      }
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "PENDING_PAYMENT",
          toStatus: "PAID",
          createdBy: `paypal:${input.captureId}`,
          note: "Pago aprobado vía PayPal.",
        },
      });
      applied = true;
    });
  } catch (err) {
    console.error("[applyPayPalPayment] Transaction failed:", err);
    return { applied: false, reason: "NOT_PENDING" };
  }

  if (!applied) return { applied: false, reason: "NOT_PENDING" };

  try {
    await notifyOrderPaid(order.id);
  } catch (err) {
    console.error("[applyPayPalPayment] notifyOrderPaid failed:", err);
  }
  try {
    await sendPaidOrderEmail(order.id);
  } catch (err) {
    console.error("[applyPayPalPayment] sendPaidOrderEmail failed:", err);
  }
  return { applied: true, orderId: order.id };
}
