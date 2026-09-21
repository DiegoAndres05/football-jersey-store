import test from "node:test";
import assert from "node:assert/strict";
import { deriveAvailability } from "../src/features/products/domain";
import { availabilityViewModel, buildProductPdpViewModel } from "../src/features/products/presentation";
import { canAddLine } from "../src/features/cart/add-line";
import { publicStoreFixtures } from "./fixtures/public-store-fixtures";

test("catalog derives the three honest availability states", () => {
  assert.equal(deriveAvailability(publicStoreFixtures.inStock.stock, false).availability, "AVAILABLE");
  assert.equal(deriveAvailability(publicStoreFixtures.backorder.stock, true).availability, "ON_DEMAND");
  assert.equal(deriveAvailability(publicStoreFixtures.soldOut.stock, false).availability, "OUT_OF_STOCK");
  assert.equal(availabilityViewModel("AVAILABLE").eta, "Despacho en 24–48 horas");
  assert.equal(availabilityViewModel("ON_DEMAND").canAddToCart, true);
  assert.equal(availabilityViewModel("OUT_OF_STOCK").canAddToCart, false);
});

test("add-line guard rejects exhausted immediate and non-backorder variants", () => {
  assert.deepEqual(canAddLine({ stock: 0, allowsBackorder: false, deliveryMode: "INMEDIATA" }), {
    ok: false,
    code: "IMMEDIATE_STOCK_EXHAUSTED",
  });
  assert.deepEqual(canAddLine({ stock: 0, allowsBackorder: false, deliveryMode: "BAJO_PEDIDO" }), {
    ok: false,
    code: "OUT_OF_STOCK",
  });
  assert.deepEqual(canAddLine({ stock: 0, allowsBackorder: true, deliveryMode: "BAJO_PEDIDO" }), { ok: true });
});

test("PDP price follows selected variant and never enables sold-out purchase", () => {
  const variant = {
    availability: "AVAILABLE" as const,
    stock: 2,
    salePrice: 199900,
  } as never;
  const state = buildProductPdpViewModel({
    availability: "OUT_OF_STOCK",
    displayPrice: 150000,
    showPrice: true,
    variants: [],
  }, variant);
  assert.equal(state.price, 199900);
  assert.equal(state.canAddToCart, true);
  const soldOut = buildProductPdpViewModel({
    availability: "OUT_OF_STOCK",
    displayPrice: 150000,
    showPrice: true,
    variants: [],
  }, null);
  assert.equal(soldOut.canAddToCart, false);
});

