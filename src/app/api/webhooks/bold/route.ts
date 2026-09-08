import { NextResponse } from "next/server";
import { applyBoldPayment } from "@/features/orders/services/apply-bold-payment";
import { normalizeWebhookEventType } from "@/features/payments/domain/bold-payment-outcome";

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
