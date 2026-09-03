import assert from "node:assert/strict";
import test from "node:test";
import { validateMeasurementProfile } from "../src/features/products/schemas/size-guide-schema";
test("accepts only reasonable cm/kg measurements", () => { assert.equal(validateMeasurementProfile({ heightCm: 175, weightKg: 72 }).success, true); });
test("returns Spanish corrections for invalid measurements", () => {
  const result = validateMeasurementProfile({ heightCm: 0, weightKg: "abc" });
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.error.issues.map((issue) => issue.message).join(" "), /altura|peso/i);
});