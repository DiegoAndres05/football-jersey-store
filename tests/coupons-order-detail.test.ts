import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveDeliverySummary } from "../src/features/orders/repositories/admin-order-repository.ts";

test("admin order helpers preserve explicit no-coupon representation", () => {
  const noCoupon = { couponCodeSnapshot: null, couponDiscountAmount: null, discountAmount: 0 };
  assert.equal(noCoupon.couponCodeSnapshot, null);
  assert.equal(noCoupon.couponDiscountAmount ?? noCoupon.discountAmount, 0);
  assert.deepEqual(deriveDeliverySummary([]), { hasImmediate: false, hasBackorder: false, isMixed: false });
});
