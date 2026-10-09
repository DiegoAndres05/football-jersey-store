import { NextResponse } from "next/server";
import { applyBoldPayment } from "@/features/orders/services/apply-bold-payment";
import { sendPaidOrderEmail } from "@/features/notifications/services/order-paid-email";
import { normalizeWebhookEventType } from "@/features/payments/domain/bold-payment-outcome";
import { parseBoldWebhookEvent } from "@/features/payments/domain/bold-webhook";
import { verifyBoldWebhookSignature } from "@/features/payments/services/bold-service";
import { getOrderByCode } from "@/features/orders/repositories/order-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature =
      request.headers.get("x-bold-signature") ??
      request.headers.get("x-signature") ??
      request.headers.get("x-bold-webhook-signature");
    if (!signature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    try {
      if (!verifyBoldWebhookSignature(body, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
    }
    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const event = parseBoldWebhookEvent(payload);

    console.log("[Bold Webhook] Event received:", {
      type: event.type,
      paymentId: event.paymentId,
      reference: event.reference,
    });

    if (!event.reference) {
      console.warn("[Bold Webhook] Missing metadata.reference, ignoring.");
      return NextResponse.json({ received: true });
    }

    const outcome = normalizeWebhookEventType(event.type);
    if (!outcome) {
      console.warn(`[Bold Webhook] Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true });
    }

    const order = await getOrderByCode(event.reference);
    if (!order) return NextResponse.json({ received: true });
    if (!Number.isInteger(event.amount) || event.amount !== order.total || event.currency !== order.saleCurrency) {
      console.warn("[Bold Webhook] Integrity mismatch; event ignored.");
      return NextResponse.json({ received: true });
    }

    const result = await applyBoldPayment({
      orderCode: event.reference,
      outcome: outcome as "APPROVED" | "REJECTED",
      source: "webhook",
      providerRef: event.paymentId ?? undefined,
    });

    if (!result.applied) {
      console.log(`[Bold Webhook] No action: ${result.reason} (order: ${event.reference})`);
      if (result.reason === "NOT_PENDING") {
        const current = await getOrderByCode(event.reference);
        if (current?.status === "PAID") {
          try {
            await sendPaidOrderEmail(current.id);
          } catch (err) {
            console.error("[Bold Webhook] sendPaidOrderEmail failed:", err);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Bold Webhook] Error processing webhook:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
