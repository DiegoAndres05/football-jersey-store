import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { canOpenBold, getPaymentConfig } from "../src/shared/config/payment";
import {
  boldWebhookSigningKey,
  computeBoldWebhookSignature,
  isValidBoldWebhookSignature,
  parseBoldWebhookEvent,
} from "../src/features/payments/domain/bold-webhook";

const body = JSON.stringify({
  id: "evt-1",
  type: "SALE_APPROVED",
  subject: "PAY-123",
  source: "/payments",
  data: {
    payment_id: "PAY-123",
    merchant_id: "M-1",
    created_at: "2026-09-29T10:00:00-05:00",
    amount: { currency: "COP", total: 200000, taxes: [], tip: 0 },
    metadata: { reference: "FS-2026-09-ABC123" },
    payment_method: "CARD",
  },
});

test("PAYMENT_PROVIDER=bold enables Bold in sandbox mode", () => {
  for (const value of ["bold", "BOLD", " bold-sandbox "]) {
    const config = getPaymentConfig({ PAYMENT_PROVIDER: value, BOLD_IDENTITY_KEY: "id", BOLD_SECRET_KEY: "secret" } as unknown as NodeJS.ProcessEnv);
    assert.equal(config.provider, "bold-sandbox");
    assert.equal(config.ready, true);
    assert.equal(canOpenBold(config, { country: "CO", currency: "COP", total: 15000 }), true);
  }
});

test("unknown provider or missing keys keep payments unavailable", () => {
  assert.equal(getPaymentConfig({ PAYMENT_PROVIDER: "stripe" } as unknown as NodeJS.ProcessEnv).provider, "unavailable");
  const noKeys = getPaymentConfig({ PAYMENT_PROVIDER: "bold" } as unknown as NodeJS.ProcessEnv);
  assert.equal(noKeys.ready, false);
  assert.equal(canOpenBold(noKeys, { country: "CO", currency: "COP", total: 15000 }), false);
});

test("webhook signature is HMAC-SHA256 over the base64 body", () => {
  const expected = createHmac("sha256", "secret").update(Buffer.from(body).toString("base64")).digest("hex");
  assert.equal(computeBoldWebhookSignature(body, "secret"), expected);
  assert.equal(isValidBoldWebhookSignature(body, expected, "secret"), true);
  assert.equal(isValidBoldWebhookSignature(body, expected.toUpperCase(), "secret"), true);
});

test("webhook signature over the raw body or with another key is rejected", () => {
  const rawBodySignature = createHmac("sha256", "secret").update(body).digest("hex");
  assert.equal(isValidBoldWebhookSignature(body, rawBodySignature, "secret"), false);
  assert.equal(isValidBoldWebhookSignature(body, computeBoldWebhookSignature(body, "other"), "secret"), false);
  assert.equal(isValidBoldWebhookSignature(body, "not-hex", "secret"), false);
});

test("sandbox webhooks are signed with an empty key and live ones with the secret", () => {
  assert.equal(boldWebhookSigningKey({ mode: "sandbox", secretKey: "secret" }), "");
  assert.equal(boldWebhookSigningKey({ mode: "live", secretKey: "secret" }), "secret");
  const sandboxSignature = createHmac("sha256", "").update(Buffer.from(body).toString("base64")).digest("hex");
  assert.equal(isValidBoldWebhookSignature(body, sandboxSignature, ""), true);
});

test("webhook event reads Bold's reference, total and currency", () => {
  assert.deepEqual(parseBoldWebhookEvent(JSON.parse(body)), {
    type: "SALE_APPROVED",
    reference: "FS-2026-09-ABC123",
    amount: 200000,
    currency: "COP",
    paymentId: "PAY-123",
  });
});

test("webhook event without a reference yields no reference", () => {
  const event = parseBoldWebhookEvent({ type: "SALE_APPROVED", data: { amount: { total: 1, currency: "COP" } } });
  assert.equal(event.reference, null);
});

test("webhook route uses the Bold event parser and the mode-aware key", () => {
  const route = readFileSync("src/app/api/webhooks/bold/route.ts", "utf8");
  assert.match(route, /parseBoldWebhookEvent/);
  assert.match(route, /x-bold-signature/);
  assert.doesNotMatch(route, /data\.reference_id/);
  assert.doesNotMatch(route, /total_amount/);
});

test("reconcile accepts Bold vouchers without currency as COP but rejects other currencies", () => {
  const reconcile = readFileSync("src/features/payments/services/bold-payment-reconcile.ts", "utf8");
  assert.match(reconcile, /const BOLD_BUTTON_CURRENCY = "COP"/);
  assert.match(reconcile, /txStatus\?\.currency\?\.trim\(\)\.toUpperCase\(\) \|\| BOLD_BUTTON_CURRENCY/);
  assert.match(reconcile, /if \(boldCurrency !== expectedCurrency\)/);
});

test("confirmation page keeps checking Bold for several minutes", () => {
  const component = readFileSync("src/app/pedido/confirmado/[code]/confirmation-payment-status.tsx", "utf8");
  const delays = component.match(/RETRY_DELAYS_MS = \[([^\]]+)\]/)?.[1].split(",").map((value) => Number(value.trim())) ?? [];
  const totalMs = delays.reduce((sum, value) => sum + value, 0);
  assert.ok(totalMs >= 4 * 60_000, `expected at least 4 minutes of retries, got ${totalMs}ms`);
});

test("reservation expiration accepts Vercel cron GET with CRON_SECRET", () => {
  const route = readFileSync("src/app/api/inventory/expire-reservations/route.ts", "utf8");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /CRON_SECRET/);
});
