import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { BOLD_VOUCHER_LOOKUP_WINDOW_MS, decideBoldExpiration } from "../src/features/payments/domain/bold-expiration";
import { toPublicBoldError } from "../src/features/payments/domain/bold-public-error";

const HOUR = 60 * 60 * 1000;

test("approved or rejected Bold sales are reconciled instead of expired", () => {
  assert.equal(decideBoldExpiration("APPROVED", HOUR), "RECONCILE");
  assert.equal(decideBoldExpiration("approved", 48 * HOUR), "RECONCILE");
  assert.equal(decideBoldExpiration("REJECTED", HOUR), "RECONCILE");
  assert.equal(decideBoldExpiration("FAILED", HOUR), "RECONCILE");
});

test("sales without a payment attempt or voided sales expire", () => {
  assert.equal(decideBoldExpiration("NO_TRANSACTION_FOUND", HOUR), "EXPIRE");
  assert.equal(decideBoldExpiration("VOIDED", HOUR), "EXPIRE");
});

test("in-flight or unknown sales wait until Bold's lookup window closes", () => {
  for (const status of ["PROCESSING", "PENDING", "SOMETHING_NEW", null]) {
    assert.equal(decideBoldExpiration(status, HOUR), "KEEP");
    assert.equal(decideBoldExpiration(status, BOLD_VOUCHER_LOOKUP_WINDOW_MS), "EXPIRE");
  }
});

test("public Bold errors keep actionable messages and hide the rest", () => {
  assert.deepEqual(toPublicBoldError("El pedido ya no está pendiente de pago."), {
    message: "El pedido ya no está pendiente de pago.",
    status: 400,
  });
  assert.deepEqual(toPublicBoldError("connect ECONNREFUSED 10.0.0.1:5432"), {
    message: "Error al preparar el pago.",
    status: 500,
  });
});

test("order creation returns the prepared Bold payload with public fields only", () => {
  const actions = readFileSync("src/features/orders/server/order-actions.ts", "utf8");
  assert.match(actions, /prepareBoldTransaction\(result\.code\)/);
  assert.match(actions, /toPublicBoldError/);
  assert.doesNotMatch(actions, /secretKey|BOLD_SECRET_KEY|idempotencyKey|transactionId/);
});

test("checkout uses the prepared payload and loads Bold in parallel", () => {
  const client = readFileSync("src/features/checkout/components/checkout-page-client.tsx", "utf8");
  assert.match(client, /const boldScript = loadBoldCheckoutScript\(\)/);
  assert.match(client, /result\.bold \?\?/);
  assert.match(client, /\/api\/bold\/hash/);
  const scriptStart = client.indexOf("const boldScript = loadBoldCheckoutScript()");
  const stockCheck = client.indexOf("await getImmediateStockByVariantIds(ids)");
  assert.ok(scriptStart > 0 && scriptStart < stockCheck, "script load starts before the stock check");
});

test("hash route and order action share the public error mapping", () => {
  const route = readFileSync("src/app/api/bold/hash/route.ts", "utf8");
  assert.match(route, /toPublicBoldError/);
});

test("reservation expiration asks Bold before cancelling Bold orders", () => {
  const service = readFileSync("src/features/orders/services/expire-inventory-reservations.ts", "utf8");
  assert.match(service, /getBoldTransactionStatus/);
  assert.match(service, /decideBoldExpiration/);
  assert.match(service, /reconcileBoldOrder/);
  const boldCheck = service.indexOf("getBoldTransactionStatus(");
  const transaction = service.indexOf("prisma.$transaction");
  assert.ok(boldCheck > 0 && boldCheck < transaction, "Bold is queried before the row lock");
});
