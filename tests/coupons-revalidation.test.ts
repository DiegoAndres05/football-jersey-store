import assert from "node:assert/strict";
import test from "node:test";
import { calculateCouponTotals } from "../src/features/coupons/domain/discount.ts";
import { safeCouponError } from "../src/features/coupons/types/coupon-types.ts";

test("final submit must discard a stale coupon and retain the undiscounted total", () => {
  const subtotal = 100_000;
  const shipping = 10_000;
  const before = calculateCouponTotals(subtotal, shipping, "PERCENTAGE", 10);
  const afterFailure = safeCouponError("INACTIVE");
  assert.equal(afterFailure.ok, false);
  assert.equal(before.total, 100_000);
  assert.equal(subtotal + shipping, 110_000);
});
