import test from "node:test";
import assert from "node:assert/strict";
import { summarizeCart } from "@/features/cart/summary";

const line = { quantity: 1, baseUnitPriceCop: 185000, personalizationSurchargeCop: 0 };
test("envío aplica estrictamente antes, en y después del umbral", () => {
  assert.equal(summarizeCart([line]).shipping, 15000);
  assert.equal(summarizeCart([{ ...line, baseUnitPriceCop: 200000 }]).shipping, 0);
  assert.equal(summarizeCart([{ ...line, baseUnitPriceCop: 220000 }]).shipping, 0);
});

test("resumen incluye recargos y limita descuento", () => {
  const result = summarizeCart([{ quantity: 2, baseUnitPriceCop: 100000, personalizationSurchargeCop: 10000 }], { discount: 999999 });
  assert.equal(result.personalizationFee, 20000);
  assert.equal(result.discount, 220000);
  assert.equal(result.total, 0);
});
