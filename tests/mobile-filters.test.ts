import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFilterHref,
  countActiveProductFilters,
} from "../src/features/products/components/product-filters.tsx";

describe("mobile catalog filters", () => {
  it("preserves unrelated query params and resets pagination", () => {
    const href = buildFilterHref(
      "/productos",
      "q=camiseta&sort=price-asc&page=4&liga=laliga",
      "talla",
      "M",
    );
    assert.equal(href, "/productos?q=camiseta&sort=price-asc&page=1&liga=laliga&talla=M");
  });

  it("removes a filter without losing the remaining query", () => {
    const href = buildFilterHref("/productos", "q=retro&modalidad=INMEDIATA&page=2", "modalidad", "");
    assert.equal(href, "/productos?q=retro&page=1");
  });

  it("clearing league also clears its dependent team", () => {
    const href = buildFilterHref("/productos", "liga=liga&equipo=equipo&page=3", "liga", "");
    assert.equal(href, "/productos?page=1");
  });

  it("counts active filters, including search and non-default sort", () => {
    assert.equal(
      countActiveProductFilters(new URLSearchParams("liga=liga&talla=M&q=retro&sort=price-asc")),
      4,
    );
    assert.equal(countActiveProductFilters(new URLSearchParams("sort=default&page=1")), 0);
  });
});
