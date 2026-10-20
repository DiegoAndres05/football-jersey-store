import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toUsdCents } from "@/shared/money/convert";
import { formatUsdCents, paypalCaptureMatches } from "@/features/payments/domain/paypal-amount";
import { parsePayPalCaptureEvent } from "@/features/payments/domain/paypal-order";
import { verifyPayPalWebhook } from "@/features/payments/services/paypal-service";
import { applyPayPalPayment } from "@/features/orders/services/apply-paypal-payment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const verified = await verifyPayPalWebhook(request.headers, payload);
  if (!verified) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = parsePayPalCaptureEvent(payload);
  if (!event) return NextResponse.json({ received: true });

  const order = await prisma.order.findUnique({
    where: { code: event.customId },
    select: { code: true, paymentMethod: true, paymentRef: true, total: true, saleCurrency: true, exchangeRateCopPerUsd: true, status: true },
  });
  if (!order || order.paymentMethod !== "PAYPAL" || order.paymentRef !== `paypal:${event.paypalOrderId}`) {
    console.warn("[PayPal Webhook] Order mismatch; event ignored.");
    return NextResponse.json({ received: true });
  }
  if (order.status !== "PENDING_PAYMENT") return NextResponse.json({ received: true });
  if (order.saleCurrency !== "USD" || !order.exchangeRateCopPerUsd) {
    return NextResponse.json({ received: true });
  }
  const expectedValue = formatUsdCents(toUsdCents(order.total, order.exchangeRateCopPerUsd));
  if (!expectedValue || !paypalCaptureMatches({
    paypalOrderId: event.paypalOrderId,
    expectedPayPalOrderId: event.paypalOrderId,
    status: event.status,
    currency: event.currency,
    value: event.value,
    customId: event.customId,
    expectedOrderCode: order.code,
    expectedValue,
  })) {
    console.warn("[PayPal Webhook] Integrity mismatch; event ignored.");
    return NextResponse.json({ received: true });
  }

  await applyPayPalPayment({
    orderCode: order.code,
    paypalOrderId: event.paypalOrderId,
    captureId: event.captureId,
  });
  return NextResponse.json({ received: true });
}
