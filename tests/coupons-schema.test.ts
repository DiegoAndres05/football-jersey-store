import { test } from "node:test";
import assert from "node:assert/strict";
import { publicCouponSchema, couponInputSchema } from "../src/features/coupons/schemas/coupon-schema.ts";

test("public schema accepts a normalized cart snapshot", () => {
  const result = publicCouponSchema.safeParse({ code: " verano10 ", lines: [{ variantId: "v1", quantity: 2, customizationType: "NONE" }] });
  assert.equal(result.success, true);
});

test("public schema rejects empty and unsafe cart lines", () => {
  assert.equal(publicCouponSchema.safeParse({ code: "", lines: [] }).success, false);
  assert.equal(publicCouponSchema.safeParse({ code: "OK", lines: [{ variantId: "v1", quantity: 0 }] }).success, false);
});

test("admin schema rejects invalid ranges", () => {
  assert.equal(couponInputSchema.safeParse({ code: "X", discountType: "PERCENTAGE", value: 101, startsAt: new Date() }).success, false);
});
