import { test } from "node:test";
import assert from "node:assert/strict";
import { couponInputSchema } from "../src/features/coupons/schemas/coupon-schema.ts";

test("admin coupon contract rejects invalid dates and negative limits", () => {
  const result = couponInputSchema.safeParse({
    code: "ADMIN10",
    discountType: "FIXED",
    value: 1000,
    startsAt: new Date("2026-06-01"),
    endsAt: new Date("2026-05-01"),
    maxUses: -1,
  });
  assert.equal(result.success, false);
});
