import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildProductWhere } from "../src/features/products/repositories/product-where.ts";
import { parseProductFiltersParams, productFiltersFromParams } from "../src/features/products/schemas/product-filters-schema.ts";
import {
  applySheetDraft,
  countSheetFilters,
  emptySheetDraft,
  sheetDraftFromSearch,
  sheetQueriesMatch,
  type SheetDraft,
} from "../src/features/products/domain/catalog-sheet-query.ts";

const bounds = { min: 50_000, max: 300_000 };

function draft(patch: Partial<SheetDraft> = {}): SheetDraft {
  return { ...emptySheetDraft(bounds), ...patch };
}

describe("mobile filter sheet query", () => {
  it("keeps search and sort, and writes the draft without the page", () => {
    const href = applySheetDraft(
      "/productos",
      "q=retro&sort=price-asc&page=3",
      draft({ size: "M", deliveryMode: "BAJO_PEDIDO", minPrice: 80_000, maxPrice: 140_000 }),
      bounds,
    );
    const params = new URLSearchParams(href.split("?")[1]);
    assert.equal(params.get("q"), "retro");
    assert.equal(params.get("sort"), "price-asc");
    assert.equal(params.get("talla"), "M");
    assert.equal(params.get("modalidad"), "BAJO_PEDIDO");
    assert.equal(params.get("precioMin"), "80000");
    assert.equal(params.get("precioMax"), "140000");
    assert.equal(params.get("page"), null);
  });

  it("drops the team when the league is cleared and omits a full price range", () => {
    const href = applySheetDraft(
      "/productos",
      "liga=premier&equipo=arsenal",
      draft(),
      bounds,
    );
    assert.equal(href, "/productos");
  });

  it("counts size and delivery, and a narrowed price, as separate filters", () => {
    assert.equal(countSheetFilters(draft({ size: "M", deliveryMode: "BAJO_PEDIDO" }), bounds), 2);
    assert.equal(countSheetFilters(draft({ maxPrice: 140_000 }), bounds), 1);
    assert.equal(countSheetFilters(draft(), bounds), 0);
  });

  it("reads the current url back into the draft", () => {
    const next = sheetDraftFromSearch("talla=L&modalidad=INMEDIATA&precioMax=140000", bounds);
    assert.equal(next.size, "L");
    assert.equal(next.deliveryMode, "INMEDIATA");
    assert.equal(next.maxPrice, 140_000);
    assert.equal(next.minPrice, bounds.min);
  });

  it("treats the same filters as unchanged even if the page differs", () => {
    const href = applySheetDraft("/productos", "talla=M&page=2", draft({ size: "M" }), bounds);
    assert.equal(sheetQueriesMatch("talla=M&page=2", href), true);
  });
});

describe("catalog price filter", () => {
  it("parses and maps precioMin and precioMax", () => {
    const raw = parseProductFiltersParams({ precioMin: "90000", precioMax: "80000", talla: "M" });
    const filters = productFiltersFromParams(raw);
    assert.equal(filters.minPrice, 80_000);
    assert.equal(filters.maxPrice, 90_000);
    assert.equal(filters.size, "M");
  });

  it("requires the same variant to match size and price", () => {
    const where = buildProductWhere({ size: "M", minPrice: 85_000, maxPrice: 140_000 });
    assert.deepEqual(where.variants, {
      some: {
        AND: [
          { size: { code: { equals: "M", mode: "insensitive" } } },
          { salePrice: { gte: 85_000, lte: 140_000 } },
        ],
      },
    });
  });
});

describe("catalog page mobile sheet", () => {
  it("opens the filter sheet from the mobile button", () => {
    const page = readFileSync(join(process.cwd(), "src/app/productos/page.tsx"), "utf8");
    assert.match(page, /MobileFilterSheet/);
    assert.doesNotMatch(page, /<details/);
  });
});
