import test from "node:test";
import assert from "node:assert/strict";
import { stockAdjustment } from "../src/features/catalog/domain/stock-target";

test("igualar stock calcula solo la diferencia", () => {
  assert.equal(stockAdjustment(2, 8), 6);
  assert.equal(stockAdjustment(8, 2), -6);
  assert.equal(stockAdjustment(4, 4), null);
  assert.equal(stockAdjustment(0, 5), 5);
});
