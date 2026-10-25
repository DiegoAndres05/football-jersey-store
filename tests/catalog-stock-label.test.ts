import assert from "node:assert/strict";
import test from "node:test";
import { formatCatalogStockLabel } from "../src/features/products/domain/catalog-stock-label.ts";

test("sin productos sigue diciendo próximamente", () => {
  assert.equal(formatCatalogStockLabel({ total: 0, purchasable: 0, soldOut: 0 }), "Próximamente");
});

test("cuenta disponibles solo cuando todos se pueden comprar", () => {
  assert.equal(
    formatCatalogStockLabel({ total: 1, purchasable: 1, soldOut: 0 }),
    "1 producto disponible",
  );
  assert.equal(
    formatCatalogStockLabel({ total: 3, purchasable: 3, soldOut: 0 }),
    "3 productos disponibles",
  );
});

test("no llama disponibles a un listado agotado", () => {
  assert.equal(
    formatCatalogStockLabel({ total: 2, purchasable: 0, soldOut: 2 }),
    "2 productos, agotados",
  );
  assert.equal(
    formatCatalogStockLabel({ total: 1, purchasable: 0, soldOut: 1 }),
    "1 producto, agotado",
  );
});

test("separa disponibles y agotados cuando el listado está mezclado", () => {
  assert.equal(
    formatCatalogStockLabel({ total: 6, purchasable: 4, soldOut: 2 }),
    "6 productos · 4 disponibles · 2 agotados",
  );
  assert.equal(
    formatCatalogStockLabel({ total: 2, purchasable: 1, soldOut: 1 }),
    "2 productos · 1 disponible · 1 agotado",
  );
});
