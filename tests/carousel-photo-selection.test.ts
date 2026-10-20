import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HOMEPAGE_CAROUSEL_MAX,
  toggleCarouselImageId,
  visibleCarouselPhotos,
  type EligibleCarouselPhoto,
} from "@/features/products/domain/homepage-carousel-slides";

describe("toggleCarouselImageId", () => {
  it("adds a new id at the end", () => {
    const result = toggleCarouselImageId(["a"], "b");
    assert.deepEqual(result, { ok: true, ids: ["a", "b"] });
  });

  it("removes an id that is already selected", () => {
    const result = toggleCarouselImageId(["a", "b", "c"], "b");
    assert.deepEqual(result, { ok: true, ids: ["a", "c"] });
  });

  it("rejects a sixth new id without mutating the list", () => {
    const current = ["a", "b", "c", "d", "e"];
    const result = toggleCarouselImageId(current, "f");
    assert.deepEqual(result, { ok: false, reason: "max", ids: current });
    assert.equal(result.ids, current);
    assert.equal(HOMEPAGE_CAROUSEL_MAX, 5);
  });

  it("still allows unselecting when already at max", () => {
    const result = toggleCarouselImageId(["a", "b", "c", "d", "e"], "c");
    assert.deepEqual(result, { ok: true, ids: ["a", "b", "d", "e"] });
  });

  it("does not silently drop the oldest to make room", () => {
    const current = ["a", "b", "c", "d", "e"];
    const result = toggleCarouselImageId(current, "z");
    assert.equal(result.ok, false);
    assert.deepEqual(result.ids, ["a", "b", "c", "d", "e"]);
  });
});

function photo(id: string, productName: string, teamName: string, leagueName = "Liga"): EligibleCarouselPhoto {
  return { id, url: "https://cdn.example.test/a.jpg", altText: null, productName, teamName, leagueName };
}

describe("visibleCarouselPhotos", () => {
  it("muestra todas las fotos cuando todavía son pocas", () => {
    const photos = [photo("1", "Local", "Millonarios")];
    const result = visibleCarouselPhotos(photos, "");
    assert.equal(result.mode, "all");
    assert.equal(result.photos.length, 1);
  });

  it("con un catálogo grande pide una búsqueda y encuentra por equipo sin acentos", () => {
    const photos = Array.from({ length: 60 }, (_, index) => photo(String(index), `Camiseta ${index}`, index === 7 ? "Atlético Nacional" : `Equipo ${index}`));
    assert.equal(visibleCarouselPhotos(photos, "").mode, "prompt");
    assert.equal(visibleCarouselPhotos(photos, "a").mode, "prompt");
    const found = visibleCarouselPhotos(photos, "atletico");
    assert.equal(found.mode, "search");
    assert.deepEqual(found.photos.map((item) => item.id), ["7"]);
  });
});
