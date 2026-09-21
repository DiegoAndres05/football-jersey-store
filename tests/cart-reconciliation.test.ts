import test from "node:test";
import assert from "node:assert/strict";
import { reconcileLines } from "@/features/cart/reconciliation";

test("reduce y elimina líneas cuyo stock cambió", () => {
  const result = reconcileLines([
    { variantId: "v1", quantity: 3, availableStock: 1, allowsBackorder: false },
    { variantId: "v2", quantity: 1, availableStock: 0, allowsBackorder: false },
    { variantId: "v3", quantity: 4, availableStock: 0, allowsBackorder: true },
  ]);
  assert.deepEqual(result.lines.map((line) => [line.variantId, line.quantity]), [["v1", 1], ["v3", 4]]);
  assert.equal(result.changed, true);
  assert.equal(result.messages.length, 2);
});
