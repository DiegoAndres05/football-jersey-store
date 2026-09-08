import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import {
  assertBoldOrderId,
  buildBoldCheckoutPayload,
  buildBoldCustomerData,
  canonicalizeBoldSale,
  formatBoldAmount,
  sanitizeBoldRedirectionUrl,
} from "../src/features/payments/domain/bold-checkout-attrs.ts";
import { computeBoldIntegritySignature } from "../src/features/payments/domain/bold-integrity.ts";

// Example values from Bold's public integration guide (not a merchant secret).
const BOLD_DOC_ORDER_ID = "inv0334";
const BOLD_DOC_AMOUNT = 39400;
const BOLD_DOC_CURRENCY = "COP";
const BOLD_DOC_SECRET = "kgfq2nN0o52XqnuXZWIN2F";
const BOLD_DOC_CONCAT = "inv033439400COPkgfq2nN0o52XqnuXZWIN2F";

test("integrity signature is SHA-256 of orderId + amount + currency + secret (Bold docs)", () => {
  const expected = createHash("sha256").update(BOLD_DOC_CONCAT, "utf8").digest("hex");
  assert.equal(
    computeBoldIntegritySignature(BOLD_DOC_ORDER_ID, BOLD_DOC_AMOUNT, BOLD_DOC_CURRENCY, BOLD_DOC_SECRET),
    expected,
  );
});

test("integrity signature is not HMAC-SHA256 (the previous implementation)", () => {
  const hmac = createHmac("sha256", BOLD_DOC_SECRET).update(BOLD_DOC_CONCAT).digest("hex");
  const actual = computeBoldIntegritySignature(
    BOLD_DOC_ORDER_ID,
    BOLD_DOC_AMOUNT,
    BOLD_DOC_CURRENCY,
    BOLD_DOC_SECRET,
  );
  assert.notEqual(actual, hmac);
  assert.equal(actual.length, 64);
});

test("amount is canonicalized to an integer string without decimals", () => {
  assert.equal(formatBoldAmount(39400), "39400");
  assert.equal(formatBoldAmount(39400.4), "39400");
  assert.equal(formatBoldAmount("39400.0"), "39400");
  assert.equal(canonicalizeBoldSale({
    orderId: BOLD_DOC_ORDER_ID,
    amount: "39400.49",
    currency: "cop",
  }).amount, "39400");
});

test("order-id must match Bold's alphanumeric / hyphen / underscore rule", () => {
  assert.equal(assertBoldOrderId("FS-2026-09-AB12"), "FS-2026-09-AB12");
  assert.throws(() => assertBoldOrderId("#123"), /order-id/);
  assert.throws(() => assertBoldOrderId("pedido 1"), /order-id/);
});

test("customer phone is digits-only so data-customer-data stays valid", () => {
  const json = buildBoldCustomerData({
    email: "lola@example.com",
    fullName: "Lola Flores",
    phone: "+57 (304) 077-7777",
  });
  assert.ok(json);
  const parsed = JSON.parse(json!);
  assert.equal(parsed.phone, "3040777777");
  assert.equal(parsed.dialCode, "+57");
  assert.equal(parsed.email, "lola@example.com");
});

test("redirection URL must be https, or http://localhost (never 127.0.0.1)", () => {
  assert.equal(
    sanitizeBoldRedirectionUrl("https://flashsport.co/pedido/confirmado/FS-1"),
    "https://flashsport.co/pedido/confirmado/FS-1",
  );
  assert.equal(
    sanitizeBoldRedirectionUrl("http://127.0.0.1:3000/pedido/confirmado/FS-1"),
    "http://localhost:3000/pedido/confirmado/FS-1",
  );
  assert.equal(sanitizeBoldRedirectionUrl("http://example.com/pago"), undefined);
});

test("checkout payload omits invalid optional attributes that trigger BTN-001", () => {
  const hash = computeBoldIntegritySignature(
    BOLD_DOC_ORDER_ID,
    BOLD_DOC_AMOUNT,
    BOLD_DOC_CURRENCY,
    BOLD_DOC_SECRET,
  );
  const payload = buildBoldCheckoutPayload({
    orderId: BOLD_DOC_ORDER_ID,
    amount: BOLD_DOC_AMOUNT,
    currency: BOLD_DOC_CURRENCY,
    apiKey: "test-identity-key",
    integritySignature: hash,
    description: "Pedido inv0334",
    redirectionUrl: "http://evil.example/back",
    customer: { phone: "304 077 7777", email: "lola@example.com" },
  });

  assert.equal(payload.amount, "39400");
  assert.equal(payload.orderId, BOLD_DOC_ORDER_ID);
  assert.equal(payload.renderMode, "embedded");
  assert.equal(payload.redirectionUrl, undefined);
  assert.equal(payload.integritySignature, hash);
  assert.ok(payload.customerData);
  assert.equal(JSON.parse(payload.customerData!).phone, "3040777777");
});
