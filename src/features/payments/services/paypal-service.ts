import "server-only";
import { prisma } from "@/lib/prisma";
import { toUsdCents } from "@/shared/money/convert";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { getPayPalConfig } from "@/shared/config/paypal";
import { formatUsdCents } from "@/features/payments/domain/paypal-amount";
import { parsePayPalOrder, paypalOrderIdFromRef, paypalPaymentRef } from "@/features/payments/domain/paypal-order";
import { paypalCaptureMatches } from "@/features/payments/domain/paypal-amount";
import { applyPayPalPayment } from "@/features/orders/services/apply-paypal-payment";

type PayPalToken = { value: string; expiresAt: number };
let tokenCache: PayPalToken | null = null;

function paypalConfig() {
  const config = getPayPalConfig();
  if (!config.ready) {
    throw new Error("PayPal no está configurado.");
  }
  return config;
}

async function paypalAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;
  const config = paypalConfig();
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(`${config.apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error("[PayPal] OAuth failed:", response.status);
    throw new Error("No pudimos conectar con PayPal.");
  }
  const body = await response.json() as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error("No pudimos conectar con PayPal.");
  tokenCache = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 300) * 1000,
  };
  return body.access_token;
}

async function paypalFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const config = paypalConfig();
  const token = await paypalAccessToken();
  const response = await fetch(`${config.apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(12_000),
  });
  const text = await response.text();
  if (!response.ok) {
    let issue = "";
    try {
      const parsed = JSON.parse(text) as { name?: string; details?: Array<{ issue?: string; field?: string }> };
      const detail = parsed.details?.[0];
      issue = [parsed.name, detail?.issue, detail?.field].filter(Boolean).join(" ");
    } catch {
      issue = "";
    }
    console.error("[PayPal] API failed:", response.status, path, issue);
    throw new Error("No pudimos completar el pago con PayPal.");
  }
  return text ? JSON.parse(text) as unknown : null;
}

function expectedValue(order: { total: number; saleCurrency: string; exchangeRateCopPerUsd: number | null }): string {
  if (order.saleCurrency !== "USD" || !order.exchangeRateCopPerUsd || order.exchangeRateCopPerUsd <= 0) {
    throw new Error("El pedido no tiene un valor en dólares.");
  }
  const cents = toUsdCents(order.total, order.exchangeRateCopPerUsd);
  const value = formatUsdCents(cents);
  if (!value) throw new Error("El pedido no tiene un valor en dólares.");
  return value;
}

export async function createPayPalCheckout(orderCode: string): Promise<{ approveUrl: string }> {
  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    select: {
      code: true,
      status: true,
      paymentMethod: true,
      paymentRef: true,
      total: true,
      saleCurrency: true,
      exchangeRateCopPerUsd: true,
    },
  });
  if (!order || order.status !== "PENDING_PAYMENT" || order.paymentMethod !== "PAYPAL") {
    throw new Error("El pedido no está listo para PayPal.");
  }
  const value = expectedValue(order);
  const existingId = paypalOrderIdFromRef(order.paymentRef);
  if (existingId) {
    const existing = parsePayPalOrder(await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(existingId)}`));
    if (existing?.approveUrl && existing.customId === order.code && existing.currency === "USD" && existing.value === value && (existing.status === "CREATED" || existing.status === "PAYER_ACTION_REQUIRED")) {
      return { approveUrl: existing.approveUrl };
    }
  }

  const origin = resolvePublicOrigin();
  const created = parsePayPalOrder(await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: order.code,
        amount: { currency_code: "USD", value },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Flashsport",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: `${origin}/api/paypal/return`,
            cancel_url: `${origin}/checkout?paypal=cancelled`,
          },
        },
      },
    }),
  }));
  if (!created?.approveUrl || created.customId !== order.code || created.currency !== "USD" || created.value !== value) {
    throw new Error("PayPal no devolvió un enlace de pago válido.");
  }
  const saved = await prisma.order.updateMany({
    where: {
      code: order.code,
      status: "PENDING_PAYMENT",
      paymentMethod: "PAYPAL",
      OR: [
        { paymentRef: null },
        { paymentRef: { not: { startsWith: "paypal:" } } },
        { paymentRef: paypalPaymentRef(created.id) },
      ],
    },
    data: { paymentRef: paypalPaymentRef(created.id) },
  });
  if (saved.count === 1) return { approveUrl: created.approveUrl };
  const winner = await prisma.order.findUnique({ where: { code: order.code }, select: { paymentRef: true } });
  const winnerId = paypalOrderIdFromRef(winner?.paymentRef);
  if (!winnerId) throw new Error("No pudimos abrir PayPal.");
  const winnerOrder = parsePayPalOrder(await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(winnerId)}`));
  if (!winnerOrder?.approveUrl) throw new Error("No pudimos abrir PayPal.");
  return { approveUrl: winnerOrder.approveUrl };
}

export async function capturePayPalReturn(paypalOrderId: string): Promise<{ ok: true; orderCode: string } | { ok: false }> {
  if (!/^[A-Za-z0-9]+$/.test(paypalOrderId)) return { ok: false };
  const order = await prisma.order.findFirst({
    where: { paymentRef: paypalPaymentRef(paypalOrderId), paymentMethod: "PAYPAL" },
    select: {
      code: true,
      status: true,
      total: true,
      saleCurrency: true,
      exchangeRateCopPerUsd: true,
    },
  });
  if (!order) return { ok: false };
  if (order.status === "PAID") return { ok: true, orderCode: order.code };
  if (order.status !== "PENDING_PAYMENT") return { ok: false };

  let value: string;
  try {
    value = expectedValue(order);
  } catch (err) {
    console.error("[PayPal] Amount check failed:", err);
    return { ok: false };
  }

  const current = parsePayPalOrder(await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`));
  if (!current || current.id !== paypalOrderId || current.customId !== order.code || current.currency !== "USD" || current.value !== value) {
    console.error("[PayPal] Order snapshot mismatch.");
    return { ok: false };
  }

  let captured = current.status === "COMPLETED" ? current : null;
  if (!captured) {
    try {
      captured = parsePayPalOrder(await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, { method: "POST" }));
    } catch (err) {
      console.error("[PayPal] Capture request failed:", err);
      captured = parsePayPalOrder(await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`));
    }
  }
  if (!captured?.captureId || !captured.captureStatus || !captured.captureCurrency || !captured.captureValue) {
    return { ok: false };
  }
  if (!paypalCaptureMatches({
    paypalOrderId: captured.id,
    expectedPayPalOrderId: paypalOrderId,
    status: captured.captureStatus,
    currency: captured.captureCurrency,
    value: captured.captureValue,
    customId: captured.customId,
    expectedOrderCode: order.code,
    expectedValue: value,
  })) {
    console.error("[PayPal] Capture integrity mismatch.");
    return { ok: false };
  }

  const applied = await applyPayPalPayment({
    orderCode: order.code,
    paypalOrderId,
    captureId: captured.captureId,
  });
  if (!applied.applied && applied.reason !== "NOT_PENDING") return { ok: false };
  return { ok: true, orderCode: order.code };
}

export async function verifyPayPalWebhook(headers: Headers, event: unknown): Promise<boolean> {
  const config = getPayPalConfig();
  if (!config.ready || !config.webhookId) return false;
  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionTime = headers.get("paypal-transmission-time");
  const transmissionSig = headers.get("paypal-transmission-sig");
  const certUrl = headers.get("paypal-cert-url");
  const authAlgo = headers.get("paypal-auth-algo");
  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) return false;
  try {
    const body = await paypalFetch("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: config.webhookId,
        webhook_event: event,
      }),
    });
    return Boolean(body && typeof body === "object" && (body as { verification_status?: string }).verification_status === "SUCCESS");
  } catch (err) {
    console.error("[PayPal] Webhook verification failed:", err);
    return false;
  }
}
