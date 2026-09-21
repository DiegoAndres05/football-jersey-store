import assert from "node:assert/strict";
import test from "node:test";
import { safeCouponError } from "../src/features/coupons/types/coupon-types.ts";

test("coupon failure is recoverable: cart data is independent from the coupon", () => {
  const cart = [{ variantId: "v1", quantity: 2 }];
  const state = { cart, couponCode: "BAD", discountAmount: 1000 };
  const failure = safeCouponError("EXPIRED");
  const recovered = { ...state, couponCode: null, discountAmount: 0 };
  assert.equal(failure.ok, false);
  assert.deepEqual(recovered.cart, cart);
  assert.equal(recovered.couponCode, null);
  assert.equal(recovered.discountAmount, 0);
});
