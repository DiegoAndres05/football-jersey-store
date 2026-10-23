import test from "node:test";
import assert from "node:assert/strict";
import { isSoldOutListing, sortPurchasableFirst } from "../src/features/products/domain/catalog-listing-order";

test("bajo pedido y entrega inmediata van antes que agotada, sin mezclar su orden", () => {
  const items = [
    { id: "nueva-agotada", variants: [{ stock: 0, allowsBackorder: false }] },
    { id: "inmediata", variants: [{ stock: 2, allowsBackorder: false }] },
    { id: "agotada-vieja", variants: [{ stock: 0, allowsBackorder: false }] },
    { id: "bajo-pedido", variants: [{ stock: 0, allowsBackorder: true }] },
  ];

  const ordered = sortPurchasableFirst(items, (item) => isSoldOutListing(item.variants));
  assert.deepEqual(
    ordered.map((item) => item.id),
    ["inmediata", "bajo-pedido", "nueva-agotada", "agotada-vieja"],
  );
});

test("sin stock y sin bajo pedido es agotada", () => {
  assert.equal(isSoldOutListing([{ stock: 0, allowsBackorder: false }]), true);
  assert.equal(isSoldOutListing([{ stock: 0, allowsBackorder: true }]), false);
  assert.equal(isSoldOutListing([{ stock: 1, allowsBackorder: false }]), false);
  assert.equal(isSoldOutListing([]), true);
});
