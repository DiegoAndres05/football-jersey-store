import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveCheckoutPayment } from "../src/features/payments/domain/checkout-payment-route.ts";
import { formatUsdCents, isPayPalApproveUrl, paypalCaptureMatches } from "../src/features/payments/domain/paypal-amount.ts";
import { parsePayPalCaptureEvent, parsePayPalOrder } from "../src/features/payments/domain/paypal-order.ts";
import { getPayPalConfig } from "../src/shared/config/paypal.ts";

test("Colombia uses Bold and other destinations use PayPal", () => {
  assert.deepEqual(resolveCheckoutPayment("Colombia", "CARD"), { ok: true, route: "BOLD", saleCurrency: "COP" });
  assert.deepEqual(resolveCheckoutPayment("CO", "PSE"), { ok: true, route: "BOLD", saleCurrency: "COP" });
  assert.equal(resolveCheckoutPayment("Colombia", "PAYPAL").ok, false);
  assert.deepEqual(resolveCheckoutPayment("Estados Unidos", "PAYPAL"), { ok: true, route: "PAYPAL", saleCurrency: "USD" });
  assert.equal(resolveCheckoutPayment("España", "CARD").ok, false);
});

test("PayPal amounts stay exact cent strings", () => {
  assert.equal(formatUsdCents(2500), "25.00");
  assert.equal(formatUsdCents(5), "0.05");
  assert.equal(formatUsdCents(0), null);
  assert.equal(paypalCaptureMatches({
    paypalOrderId: "ORDER1",
    expectedPayPalOrderId: "ORDER1",
    status: "COMPLETED",
    currency: "USD",
    value: "25.00",
    customId: "FS-2026-10-ABCDE",
    expectedOrderCode: "FS-2026-10-ABCDE",
    expectedValue: "25.00",
  }), true);
  assert.equal(paypalCaptureMatches({
    paypalOrderId: "ORDER1",
    expectedPayPalOrderId: "ORDER1",
    status: "COMPLETED",
    currency: "USD",
    value: "25.01",
    customId: "FS-2026-10-ABCDE",
    expectedOrderCode: "FS-2026-10-ABCDE",
    expectedValue: "25.00",
  }), false);
});

test("only PayPal hosted approval links are accepted", () => {
  assert.equal(isPayPalApproveUrl("https://www.sandbox.paypal.com/checkoutnow?token=ABC"), true);
  assert.equal(isPayPalApproveUrl("https://www.paypal.com/checkoutnow?token=ABC"), true);
  assert.equal(isPayPalApproveUrl("https://checkout.bold.co/pay"), false);
  assert.equal(isPayPalApproveUrl("http://www.paypal.com/checkoutnow"), false);
});

test("PayPal order and capture parsers keep the order reference", () => {
  const order = parsePayPalOrder({
    id: "ORDER1",
    status: "CREATED",
    purchase_units: [{ custom_id: "FS-1", amount: { currency_code: "USD", value: "10.00" } }],
    links: [{ rel: "approve", href: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1" }],
  });
  assert.equal(order?.approveUrl, "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1");
  assert.equal(order?.customId, "FS-1");

  const event = parsePayPalCaptureEvent({
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "CAP1",
      status: "COMPLETED",
      custom_id: "FS-1",
      amount: { currency_code: "USD", value: "10.00" },
      supplementary_data: { related_ids: { order_id: "ORDER1" } },
    },
  });
  assert.equal(event?.paypalOrderId, "ORDER1");
  assert.equal(parsePayPalCaptureEvent({ event_type: "CHECKOUT.ORDER.APPROVED", resource: {} }), null);
});

test("PayPal config stays server-only and defaults to sandbox", () => {
  const missing = getPayPalConfig({});
  assert.equal(missing.ready, false);
  assert.equal(missing.apiBase, "https://api-m.sandbox.paypal.com");
  const live = getPayPalConfig({
    PAYPAL_CLIENT_ID: "client",
    PAYPAL_CLIENT_SECRET: "secret",
    PAYPAL_ENV: "live",
    PAYPAL_WEBHOOK_ID: "WH-1",
  });
  assert.equal(live.ready, true);
  assert.equal(live.apiBase, "https://api-m.paypal.com");
  assert.equal(live.webhookId, "WH-1");
});

test("checkout shows one Bold button in Colombia and one PayPal button elsewhere", () => {
  const source = readFileSync("src/features/checkout/components/checkout-page-client.tsx", "utf8");
  assert.match(source, /Pagar con Bold/);
  assert.match(source, /Pagar con PayPal/);
  assert.doesNotMatch(source, /Tarjeta débito o crédito/);
  assert.doesNotMatch(source, /cotización pendiente/);
});
