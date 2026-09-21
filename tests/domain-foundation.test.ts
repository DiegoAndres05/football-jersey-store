import test from "node:test";
import assert from "node:assert/strict";
import { deriveAvailability } from "../src/features/products/domain";
import { calculatePricing } from "../src/features/checkout/pricing";
import { reconcileLines } from "../src/features/cart/reconciliation";
import { transitionPayment } from "../src/features/payments/state-machine";

test("derives stock states and CTA", () => {
  assert.equal(deriveAvailability(2, false).label, "En stock");
  assert.equal(deriveAvailability(0, true).availability, "ON_DEMAND");
  assert.equal(deriveAvailability(0, false).canAddToCart, false);
});

test("shipping threshold is inclusive and personalization is per line", () => {
  assert.equal(calculatePricing([{ quantity: 1, baseUnitPriceCop: 175000, personalizationSurchargeCop: 25000 }]).shipping, 0);
  assert.equal(calculatePricing([{ quantity: 1, baseUnitPriceCop: 199999 }]).shipping, 15000);
});

test("reconciliation is recoverable and payment transitions are idempotent", () => {
  const result = reconcileLines([{ variantId: "v", quantity: 3, availableStock: 1, allowsBackorder: false }]);
  assert.deepEqual(result.lines[0].quantity, 1);
  assert.equal(transitionPayment("APPROVED", "reject"), "APPROVED");
});
