import assert from "node:assert/strict";
import test from "node:test";
import { recommendSize } from "../src/features/products/services/size-recommender";
test("recommends inclusive Fan ranges and height tolerance", () => {
  assert.equal(recommendSize("FAN", { heightCm: 171, weightKg: 68 }).primarySize, "M");
  assert.equal(recommendSize("FAN", { heightCm: 170, weightKg: 65 }).primarySize, "S");
});
test("uses weight to resolve Fan 3XL/4XL overlap", () => {
  assert.equal(recommendSize("FAN", { heightCm: 191, weightKg: 100 }).primarySize, "4XL");
  assert.equal(recommendSize("FAN", { heightCm: 191, weightKg: 90 }).primarySize, "3XL");
});
test("does not infer unavailable Player sizes", () => {
  assert.equal(recommendSize("PLAYER", { heightCm: 195, weightKg: 100 }).status, "NO_MATCH");
});
test("reports unavailable primary size without making it buyable", () => {
  const result = recommendSize("FAN", { heightCm: 171, weightKg: 68 }, [{ sizeCode: "M", availability: "OUT_OF_STOCK" }]);
  assert.equal(result.status, "UNAVAILABLE");
  assert.equal(result.availablePrimary, false);
});