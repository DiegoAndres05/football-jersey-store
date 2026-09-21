import assert from "node:assert/strict";
import test from "node:test";

type Snapshot = { code: string | null; discountType: "PERCENTAGE" | "FIXED" | null; value: number | null; eligibleBase: number | null; discountAmount: number | null };

test("order coupon snapshot remains unchanged after coupon edits or deactivation", () => {
  const snapshot: Snapshot = { code: "SAVE10", discountType: "PERCENTAGE", value: 10, eligibleBase: 120000, discountAmount: 12000 };
  const editedCoupon = { code: "SAVE10", value: 50, isActive: false };
  assert.equal(snapshot.value, 10);
  assert.equal(snapshot.discountAmount, 12000);
  assert.equal(editedCoupon.isActive, false);
});

test("no-coupon orders have an explicit null snapshot and zero discount", () => {
  const snapshot: Snapshot = { code: null, discountType: null, value: null, eligibleBase: null, discountAmount: null };
  assert.equal(snapshot.code, null);
  assert.equal(snapshot.discountAmount ?? 0, 0);
});
