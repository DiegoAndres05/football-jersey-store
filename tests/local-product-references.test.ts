import assert from "node:assert/strict";
import test from "node:test";
import { resolveLocalProductReferences } from "../src/features/products/services/local-product-references";
test("resolves current public product data and preserves unavailable references", () => {
  const product = { id: "p1", slug: "camiseta", name: "Camiseta", primaryImage: { url: "/a.jpg", altText: null }, minPrice: 100, availability: "AVAILABLE" } as never;
  const result = resolveLocalProductReferences([{ productId: "p1", slug: "camiseta" }, { productId: "gone", slug: "gone" }], [product]);
  assert.equal(result[0].minPrice, 100); assert.equal(result[1].availability, "NOT_FOUND");
});