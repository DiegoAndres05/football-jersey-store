import test from "node:test";
import assert from "node:assert/strict";
import { deriveProductDisplayPrice } from "../src/features/products/domain/product-price-display";

test("card policy never renders zero for sold-out products", () => {
  const soldOut = deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice: null });
  assert.equal(soldOut.showPrice, false);
  assert.notEqual(soldOut.displayPrice, 0);
  assert.equal(soldOut.statusLabel, "Agotado");
});

test("card policy renders a real fallback price when available", () => {
  const soldOut = deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice: 179900 });
  assert.ok(soldOut.displayPrice && soldOut.displayPrice > 0);
  assert.equal(soldOut.statusLabel, "Agotado");
});

test("available card retains current price", () => {
  const available = deriveProductDisplayPrice({ availability: "AVAILABLE", currentPrice: 169900 });
  assert.equal(available.displayPrice, 169900);
  assert.equal(available.statusLabel, "En stock");
});
