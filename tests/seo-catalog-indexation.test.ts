import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decideCatalogIndexation } from "@/features/seo/domain/catalog-indexation";

describe("decideCatalogIndexation", () => {
  it("empty query → index", () => {
    const result = decideCatalogIndexation({});
    assert.deepStrictEqual(result, { action: "index" });
  });

  it("only liga=slug → redirect to /ligas/{slug}", () => {
    const result = decideCatalogIndexation({ liga: "liga-colombiana" });
    assert.deepStrictEqual(result, {
      action: "redirect",
      destination: "/ligas/liga-colombiana",
    });
  });

  it("only equipo=slug → redirect to /equipos/{slug}", () => {
    const result = decideCatalogIndexation({ equipo: "millonarios" });
    assert.deepStrictEqual(result, {
      action: "redirect",
      destination: "/equipos/millonarios",
    });
  });

  it("liga=slug&q=x → noindex", () => {
    const result = decideCatalogIndexation({ liga: "liga-colombiana", q: "camiseta" });
    assert.deepStrictEqual(result, { action: "noindex" });
  });

  it("q=search → noindex", () => {
    const result = decideCatalogIndexation({ q: "camiseta" });
    assert.deepStrictEqual(result, { action: "noindex" });
  });

  it("sort=price → noindex", () => {
    const result = decideCatalogIndexation({ sort: "price-asc" });
    assert.deepStrictEqual(result, { action: "noindex" });
  });

  it("talla=M → noindex", () => {
    const result = decideCatalogIndexation({ talla: "M" });
    assert.deepStrictEqual(result, { action: "noindex" });
  });

  it("page=2 → noindex", () => {
    const result = decideCatalogIndexation({ page: "2" });
    assert.deepStrictEqual(result, { action: "noindex" });
  });

  it("page=1 → index (page=1 is not noise)", () => {
    const result = decideCatalogIndexation({ page: "1" });
    assert.deepStrictEqual(result, { action: "index" });
  });

  it("disponibilidad=inStock → noindex", () => {
    const result = decideCatalogIndexation({ disponibilidad: "AVAILABLE" });
    assert.deepStrictEqual(result, { action: "noindex" });
  });

  it("modalidad=nacional → noindex", () => {
    const result = decideCatalogIndexation({ modalidad: "INMEDIATA" });
    assert.deepStrictEqual(result, { action: "noindex" });
  });

  it("liga=x&equipo=y → noindex", () => {
    const result = decideCatalogIndexation({ liga: "liga-x", equipo: "equipo-y" });
    assert.deepStrictEqual(result, { action: "noindex" });
  });

  it("ignores empty/undefined values", () => {
    const result = decideCatalogIndexation({ liga: undefined, q: "" });
    assert.deepStrictEqual(result, { action: "index" });
  });
});
