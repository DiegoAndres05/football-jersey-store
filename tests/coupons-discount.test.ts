import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDiscount, calculateCouponTotals } from "../src/features/coupons/domain/discount.ts";

test("percentage coupons use half-up rounding and exclude shipping", () => {
  const totals = calculateCouponTotals(1501, 25000, "PERCENTAGE", 10);
  assert.equal(totals.discountAmount, 150);
  assert.equal(totals.total, 26351);
});

test("fixed discounts are capped at the eligible product base", () => {
  assert.equal(calculateDiscount(10000, "FIXED", 20000), 10000);
  assert.equal(calculateCouponTotals(10000, 5000, "FIXED", 20000).total, 5000);
});

test("invalid and fractional bases never produce a discount", () => {
  assert.equal(calculateDiscount(0, "PERCENTAGE", 50), 0);
  assert.equal(calculateDiscount(100.5, "PERCENTAGE", 50), 0);
});
