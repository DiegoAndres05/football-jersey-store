import { NextResponse } from "next/server";
import { applyBoldPayment } from "@/features/orders/services/apply-bold-payment";
import { normalizeWebhookEventType } from "@/features/payments/domain/bold-payment-outcome";
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
    const payload = JSON.parse(body);

    console.log("[Bold Webhook] Event received:", {
      type: payload.type,
      subject: payload.subject,
      referenceId: payload.data?.reference_id,
    });

    const eventType = payload.type;
    const data = payload.data ?? payload.payload ?? {};
    const referenceId = data.reference_id ?? payload.reference_id;

    if (!referenceId) {
      console.warn("[Bold Webhook] Missing reference_id, ignoring.");
      return NextResponse.json({ received: true });
    }

    const order = await getOrderByCode(String(referenceId));
    if (!order) return NextResponse.json({ received: true });
    const rawAmount = typeof data.amount === "object" ? data.amount?.total_amount : data.amount ?? data.total;
    const amount = Number(rawAmount);
    const currency = String(data.currency ?? (typeof data.amount === "object" ? data.amount?.currency : "") ?? "").toUpperCase();
    if (!Number.isInteger(amount) || amount !== order.total || currency !== order.saleCurrency) {
      console.warn("[Bold Webhook] Integrity mismatch; event ignored.");
      return NextResponse.json({ received: true });
    }

    const outcome = normalizeWebhookEventType(eventType);

    if (!outcome) {
      console.warn(`[Bold Webhook] Unknown event type: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    // At this point outcome is "APPROVED" | "REJECTED" (webhook only produces these)
    const result = await applyBoldPayment({
      orderCode: referenceId,
      outcome: outcome as "APPROVED" | "REJECTED",
      source: "webhook",
      providerRef: payload.subject ?? undefined,
    });

    if (!result.applied) {
      console.log(`[Bold Webhook] No action: ${result.reason} (order: ${referenceId})`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Bold Webhook] Error processing webhook:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
