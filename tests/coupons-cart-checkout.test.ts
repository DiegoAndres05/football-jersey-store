import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateCouponTotals } from "../src/features/coupons/domain/discount.ts";
import { checkoutCartSchema, checkoutTotalsSchema } from "../src/features/checkout/schemas/checkout-schema.ts";

test("checkout summary keeps shipping outside the coupon base", () => {
  const result = calculateCouponTotals(120000, 15000, "PERCENTAGE", 20);
  assert.equal(result.eligibleBase, 120000);
  assert.equal(result.discountAmount, 24000);
  assert.equal(result.total, 111000);
});

test("recalculation changes discount when quantity changes", () => {
  const one = calculateCouponTotals(50000, 10000, "FIXED", 12000);
  const two = calculateCouponTotals(100000, 10000, "FIXED", 12000);
  assert.equal(one.discountAmount, two.discountAmount);
  assert.equal(two.total - one.total, 50000);
});

test("authoritative checkout schema carries lines and server totals without client prices", () => {
  const cart = checkoutCartSchema.parse({
    lines: [{ variantId: "v1", quantity: 1, customizationType: "CUSTOM", deliveryMode: "INMEDIATA" }],
  });
  assert.equal(cart.saleCurrency, "COP");
  assert.equal("unitPrice" in cart.lines[0], false);
  const totals = checkoutTotalsSchema.parse({
    subtotal: 100000, personalizationFee: 5000, shippingFee: 10000,
    discountAmount: 10000, total: 100000, paymentAmount: 100000, saleCurrency: "COP",
  });
  assert.equal(totals.total, 100000);
});
