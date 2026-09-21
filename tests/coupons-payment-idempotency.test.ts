import assert from "node:assert/strict";
import test from "node:test";

test("payment transition contract accepts only one pending transition", () => {
  let status: "PENDING_PAYMENT" | "PAID" = "PENDING_PAYMENT";
  const apply = () => {
    if (status !== "PENDING_PAYMENT") return { applied: false as const, reason: "NOT_PENDING" as const };
    status = "PAID";
    return { applied: true as const, toStatus: "PAID" as const };
  };
  assert.deepEqual(apply(), { applied: true, toStatus: "PAID" });
  assert.deepEqual(apply(), { applied: false, reason: "NOT_PENDING" });
});
