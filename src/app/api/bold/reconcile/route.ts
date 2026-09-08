import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderByCode } from "@/features/orders/repositories/order-repository";
import { reconcileBoldOrder } from "@/features/payments/services/bold-payment-reconcile";

export const runtime = "nodejs";

const ReconcileSchema = z.object({
  orderCode: z.string().min(1, "orderCode is required"),
  boldOrderId: z.string().min(1).optional(),
});

/**
 * POST /api/bold/reconcile
 *
 * Server-side Bold payment reconciliation endpoint.
 * Called by the confirmation page client component after Bold redirect.
 *
 * Security model:
 * - Accepts ONLY orderCode + optional boldOrderId (order identifiers).
 * - Does NOT accept any client-provided payment status.
 * - Server queries Bold API directly using BOLD_IDENTITY_KEY.
 * - Only Bold API status APPROVED can finalize the payment.
 * - Webhook remains the authoritative asynchronous backup.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ReconcileSchema.safeParse(body);

    if (!parsed.success) {
      console.warn("[Bold Reconcile API] Invalid request:", parsed.error.flatten().fieldErrors);
      return NextResponse.json(
        { status: "ERROR", error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { orderCode, boldOrderId } = parsed.data;

    console.log(`[Bold Reconcile API] Order ${orderCode}: reconciliation requested`);

    // 1. Validate order exists
    const order = await getOrderByCode(orderCode);
    if (!order) {
      console.warn(`[Bold Reconcile API] Order ${orderCode}: not found`);
      return NextResponse.json(
        { status: "ERROR", error: "Order not found" },
        { status: 404 },
      );
    }

    // 2. Check if already finalized
    if (order.status === "PAID") {
      console.log(`[Bold Reconcile API] Order ${orderCode}: already PAID`);
      return NextResponse.json({ status: "PAID" });
    }

    if (order.status === "PAYMENT_FAILED") {
      console.log(`[Bold Reconcile API] Order ${orderCode}: already PAYMENT_FAILED`);
      return NextResponse.json({ status: "REJECTED" });
    }

    if (order.status !== "PENDING_PAYMENT") {
      console.warn(
        `[Bold Reconcile API] Order ${orderCode}: unexpected status ${order.status}`,
      );
      return NextResponse.json(
        { status: "ERROR", error: `Order in unexpected status: ${order.status}` },
        { status: 409 },
      );
    }

    // 3. Reconcile with Bold API (no returnTxStatus — server-only trust)
    const result = await reconcileBoldOrder({
      orderCode,
      boldOrderId,
      orderTotal: order.total,
      orderCurrency: order.saleCurrency ?? "COP",
      // Intentionally omit returnTxStatus — server queries Bold directly
    });

    // 4. Return outcome
    if (result.apply?.applied) {
      console.log(
        `[Bold Reconcile API] Order ${orderCode}: finalized → ${result.apply.toStatus}`,
      );
      return NextResponse.json({ status: result.apply.toStatus });
    }

    if (result.outcome === "PENDING" || result.outcome === "UNAVAILABLE") {
      console.log(`[Bold Reconcile API] Order ${orderCode}: Bold API inconclusive → PENDING`);
      return NextResponse.json({ status: "PENDING" });
    }

    // Reconcile decided NOOP but outcome is not PENDING/UNAVAILABLE — unusual
    console.log(
      `[Bold Reconcile API] Order ${orderCode}: no change (outcome=${result.outcome})`,
    );
    return NextResponse.json({ status: "PENDING" });
  } catch (err) {
    console.error("[Bold Reconcile API] Unexpected error:", err);
    return NextResponse.json(
      { status: "ERROR", error: "Internal error during reconciliation" },
      { status: 500 },
    );
  }
}
