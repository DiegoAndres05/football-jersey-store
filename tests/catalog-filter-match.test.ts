import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { productMatchesCatalogFilters } from "../src/features/products/domain/catalog-filter-match.ts";
import { parseProductFiltersParams } from "../src/features/products/schemas/product-filters-schema.ts";

const mixed = [
  { sizeCode: "M", stock: 3, allowsBackorder: true },
  { sizeCode: "L", stock: 0, allowsBackorder: true },
];
const backorderOnly = [{ sizeCode: "M", stock: 0, allowsBackorder: true }];
const soldOut = [{ sizeCode: "M", stock: 0, allowsBackorder: false }];
const sizeSold = [
  { sizeCode: "M", stock: 0, allowsBackorder: false },
  { sizeCode: "L", stock: 2, allowsBackorder: false },
];

describe("productMatchesCatalogFilters", () => {
  it("AVAILABLE = purchasable; OUT_OF_STOCK = sold out only", () => {
    assert.equal(productMatchesCatalogFilters(mixed, { availability: "AVAILABLE" }), true);
    assert.equal(productMatchesCatalogFilters(backorderOnly, { availability: "AVAILABLE" }), true);
    assert.equal(productMatchesCatalogFilters(soldOut, { availability: "AVAILABLE" }), false);
    assert.equal(productMatchesCatalogFilters(soldOut, { availability: "OUT_OF_STOCK" }), true);
    assert.equal(productMatchesCatalogFilters(backorderOnly, { availability: "OUT_OF_STOCK" }), false);
  });

  it("INMEDIATA requires stock; BAJO_PEDIDO includes mixed with stock", () => {
    assert.equal(productMatchesCatalogFilters(mixed, { deliveryMode: "INMEDIATA" }), true);
    assert.equal(productMatchesCatalogFilters(backorderOnly, { deliveryMode: "INMEDIATA" }), false);
    assert.equal(productMatchesCatalogFilters(mixed, { deliveryMode: "BAJO_PEDIDO" }), true);
    assert.equal(productMatchesCatalogFilters(backorderOnly, { deliveryMode: "BAJO_PEDIDO" }), true);
    assert.equal(productMatchesCatalogFilters(soldOut, { deliveryMode: "BAJO_PEDIDO" }), false);
  });

  it("size alone requires purchasable size", () => {
    assert.equal(productMatchesCatalogFilters(sizeSold, { sizeCode: "M" }), false);
    assert.equal(productMatchesCatalogFilters(sizeSold, { sizeCode: "L" }), true);
    assert.equal(productMatchesCatalogFilters(backorderOnly, { sizeCode: "M" }), true);
  });

  it("size + modality intersection", () => {
    assert.equal(
      productMatchesCatalogFilters(mixed, { sizeCode: "L", deliveryMode: "INMEDIATA" }),
      false,
    );
    assert.equal(
      productMatchesCatalogFilters(mixed, { sizeCode: "L", deliveryMode: "BAJO_PEDIDO" }),
      true,
    );
    assert.equal(
      productMatchesCatalogFilters(mixed, { sizeCode: "M", deliveryMode: "INMEDIATA" }),
      true,
    );
  });
});

describe("schema modalidad", () => {
  it("parses modalidad", () => {
    const r = parseProductFiltersParams({ modalidad: "INMEDIATA", talla: "M" });
    assert.equal(r.modalidad, "INMEDIATA");
    assert.equal(r.talla, "M");
  });
});

describe("ProductFilters UI (source)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/features/products/components/product-filters.tsx"),
    "utf8",
  );

  it("exposes modalidad chips in Spanish", () => {
    assert.match(src, /modalidad/);
    assert.match(src, /Entrega inmediata|INMEDIATA/);
    assert.match(src, /Bajo pedido|BAJO_PEDIDO/);
  });
});
