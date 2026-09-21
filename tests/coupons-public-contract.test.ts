import { test } from "node:test";
import assert from "node:assert/strict";
import { safeCouponError } from "../src/features/coupons/types/coupon-types.ts";

test("public coupon contract exposes stable Spanish rejection shapes", () => {
  for (const reason of ["INVALID_FORMAT", "NOT_FOUND", "INACTIVE", "NOT_STARTED", "EXPIRED", "EXHAUSTED", "NOT_APPLICABLE", "INVALID_CART", "TEMPORARILY_UNAVAILABLE"] as const) {
    const result = safeCouponError(reason);
    assert.equal(result.ok, false);
    assert.equal(result.reason, reason);
    assert.ok(result.message.length > 0);
    assert.equal("count" in result, false);
  }
});

test("rejection matrix is exhaustive and never leaks availability details", () => {
  const reasons = ["INVALID_FORMAT", "NOT_FOUND", "INACTIVE", "NOT_STARTED", "EXPIRED", "EXHAUSTED", "NOT_APPLICABLE", "INVALID_CART", "TEMPORARILY_UNAVAILABLE"] as const;
  assert.deepEqual(reasons.map((reason) => safeCouponError(reason).reason), reasons);
  for (const reason of reasons) {
    const result = safeCouponError(reason);
    assert.equal(result.ok, false);
    assert.doesNotMatch(result.message, /stock|sql|prisma|count/i);
  }
});
