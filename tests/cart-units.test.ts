import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { cartUnitCount, cartUnitLabel } from "../src/features/cart/domain/cart-units.ts";

test("el checkout cuenta unidades y no líneas", () => {
  assert.equal(cartUnitCount([{ quantity: 2 }]), 2);
  assert.equal(cartUnitCount([{ quantity: 1 }, { quantity: 2 }]), 3);
  assert.equal(cartUnitCount([{ quantity: 0 }, { quantity: Number.NaN }]), 0);
  assert.equal(cartUnitLabel(1), "1 artículo");
  assert.equal(cartUnitLabel(2), "2 artículos");
});

test("el pago usa el conteo de unidades", () => {
  const source = readFileSync("src/features/checkout/components/checkout-page-client.tsx", "utf8");
  assert.match(source, /cartUnitCount\(items\)/);
  assert.match(source, /cartUnitLabel/);
  assert.doesNotMatch(source, /if \(!mounted\) return null/);
});
