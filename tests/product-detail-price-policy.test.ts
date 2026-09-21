import test from "node:test";
import assert from "node:assert/strict";
import { deriveProductDisplayPrice } from "../src/features/products/domain/product-price-display";

test("detail sold-out state is non-zero or hidden", () => {
  for (const lastValidProductPrice of [250000, null, 0, -1]) {
    const state = deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice });
    assert.notEqual(state.displayPrice, 0);
    assert.equal(state.statusLabel, "Agotado");
  }
});

test("detail fallback does not enable purchase", () => {
  const state = deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice: 220000 });
  assert.equal(state.availability, "OUT_OF_STOCK");
  assert.equal(state.displayPrice, 220000);
});
