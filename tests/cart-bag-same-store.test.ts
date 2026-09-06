import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("PDP add-to-cart button imports useCartStore", () => {
  const src = readFileSync("src/features/products/components/add-to-cart-button.tsx", "utf8");
  assert.match(src, /import.*useCartStore.*from/);
  assert.match(src, /useCartStore\(/);
});

test("cart-page-client imports useCartStore", () => {
  const src = readFileSync("src/features/cart/components/cart-page-client.tsx", "utf8");
  assert.match(src, /import.*useCartStore.*from/);
  assert.match(src, /useCartStore\(/);
});

test("cart-page-client does not declare a sample-items useState", () => {
  const src = readFileSync("src/features/cart/components/cart-page-client.tsx", "utf8");
  const lines = src.split("\n");
  const useStateLines = lines.filter(
    (l) => /useState\s*</.test(l) && /sample|demo|shoe|hardcoded|items\s*\=/.test(l),
  );
  assert.equal(
    useStateLines.length,
    0,
    "cart-page-client should not declare a local sample/demo cart array via useState",
  );
});
