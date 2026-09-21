import test from "node:test";
import assert from "node:assert/strict";
import { deriveProductDisplayPrice } from "../src/features/products/domain/product-price-display";

test("sold-out product keeps the last positive price", () => {
  const state = deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice: 189900 });
  assert.equal(state.displayPrice, 189900);
  assert.equal(state.showPrice, true);
  assert.equal(state.statusLabel, "Agotado");
});

test("sold-out product without a valid price hides the price", () => {
  const state = deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice: 0 });
  assert.equal(state.displayPrice, null);
  assert.equal(state.showPrice, false);
  assert.notEqual(state.displayPrice, 0);
});

test("available product keeps its current positive offer", () => {
  const state = deriveProductDisplayPrice({
    availability: "AVAILABLE",
    currentPrice: 159900,
    lastValidProductPrice: 189900,
  });
  assert.equal(state.displayPrice, 159900);
  assert.equal(state.statusLabel, "En stock");
});

test("policy is stable when stock changes", () => {
  const price = 199900;
  assert.equal(deriveProductDisplayPrice({ availability: "AVAILABLE", currentPrice: price }).displayPrice, price);
  assert.equal(deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice: price }).displayPrice, price);
});
