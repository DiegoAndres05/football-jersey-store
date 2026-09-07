import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyOrderPaid } from "@/features/notifications/services/notification-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    console.log("[Bold Webhook] Event received:", {
      type: payload.type,
      subject: payload.subject,
      referenceId: payload.data?.reference_id,
    });

    const eventType = payload.type;
    const referenceId = payload.data?.reference_id;

    if (!referenceId) {
      console.warn("[Bold Webhook] Missing reference_id, ignoring.");
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { code: referenceId },
      select: { id: true, status: true },
    });

    if (!order) {
      console.warn(`[Bold Webhook] Order not found: ${referenceId}`);
      return NextResponse.json({ received: true });
    }

    if (eventType === "SALE_APPROVED") {
      if (order.status === "PENDING_PAYMENT") {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "PAID", paidAt: new Date() },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: "PAID",
              createdBy: `bold-webhook:${payload.subject ?? "unknown"}`,
              note: "Pago aprobado vía Bold webhook.",
            },
          });
        });
        void notifyOrderPaid(order.id).catch(() => undefined);
      }
    } else if (eventType === "SALE_REJECTED") {
      if (order.status === "PENDING_PAYMENT") {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "PAYMENT_FAILED" },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: "PAYMENT_FAILED",
              createdBy: `bold-webhook:${payload.subject ?? "unknown"}`,
              note: "Pago rechazado vía Bold webhook.",
            },
          });
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Bold Webhook] Error processing webhook:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
