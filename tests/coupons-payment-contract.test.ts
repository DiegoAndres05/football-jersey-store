import assert from "node:assert/strict";
import test from "node:test";
import { calculateCouponTotals } from "../src/features/coupons/domain/discount.ts";

test("payment amount is derived from persisted order totals, not provider input", () => {
  const persisted = calculateCouponTotals(120000, 15000, "PERCENTAGE", 20);
  const providerPayload = { amount: 1, discount: 999999 };
  const amountSentToProvider = persisted.total;
  assert.equal(amountSentToProvider, 111000);
  assert.notEqual(amountSentToProvider, providerPayload.amount);
  assert.equal(persisted.discountAmount, 24000);
});
