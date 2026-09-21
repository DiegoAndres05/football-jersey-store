import { test } from "node:test";
import assert from "node:assert/strict";
import { availableCouponUses } from "../src/features/coupons/repositories/coupon-repository.ts";

test("expired reservations do not consume coupon capacity", () => {
  const now = new Date("2026-09-20T12:00:00Z");
  assert.equal(availableCouponUses({ maxUses: 1, usages: [{ state: "RESERVED", expiresAt: new Date("2026-09-20T11:59:00Z") }] }, now), true);
  assert.equal(availableCouponUses({ maxUses: 1, usages: [{ state: "RESERVED", expiresAt: new Date("2026-09-20T12:01:00Z") }] }, now), false);
});
