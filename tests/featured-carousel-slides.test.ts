import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slidesForFeaturedCarousel } from "@/features/products/domain/featured-carousel-slides";
import type { ProductCardData } from "@/features/products/types/product-types";

function make(overrides: Partial<ProductCardData> = {}): ProductCardData {
  return {
    id: overrides.id ?? "p1",
    slug: overrides.slug ?? "slug-1",
    name: overrides.name ?? "Product 1",
    shortName: null,
    kitType: "jersey",
    brand: null,
    isFeatured: true,
    team: {
      id: "t1",
      slug: "team-1",
      name: "Team 1",
      shortName: null,
      league: { id: "l1", slug: "league-1", name: "League 1" },
    },
    season: { id: "s1", slug: "season-1", name: "2025", isRetro: false },
    primaryImage:
      overrides.primaryImage !== undefined
        ? overrides.primaryImage
        : { id: "img1", url: "https://img.test/1.jpg", altText: "Img 1" },
    minPrice: 49.99,
    maxPrice: 89.99,
    availability: "AVAILABLE",
    availableSizes: ["S", "M", "L"],
    versionNames: ["Home"],
    canBackorder: false,
    ...overrides,
  };
}

describe("slidesForFeaturedCarousel", () => {
  it("0 products → []", () => {
    const result = slidesForFeaturedCarousel([]);
    assert.deepEqual(result, []);
  });

  it("1 product with photo → [] (needs at least 2)", () => {
    const result = slidesForFeaturedCarousel([make()]);
    assert.deepEqual(result, []);
  });

  it("2 products with primaryImage.url → those products, order preserved", () => {
    const a = make({ id: "a", slug: "a" });
    const b = make({ id: "b", slug: "b" });
    const result = slidesForFeaturedCarousel([a, b]);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "a");
    assert.equal(result[1].id, "b");
  });

  it("products without primaryImage.url are excluded", () => {
    const a = make({ id: "a" });
    const b = make({ id: "b" });
    const noImg = make({ id: "no", primaryImage: null });
    const result = slidesForFeaturedCarousel([a, noImg, b]);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "a");
    assert.equal(result[1].id, "b");
  });

  it("all without primaryImage.url → []", () => {
    const a = make({ id: "a", primaryImage: null });
    const b = make({ id: "b", primaryImage: null });
    const result = slidesForFeaturedCarousel([a, b]);
    assert.deepEqual(result, []);
  });

  it("1 with photo + 1 without → [] (only 1 valid)", () => {
    const withImg = make({ id: "ok" });
    const noImg = make({ id: "no", primaryImage: null });
    const result = slidesForFeaturedCarousel([withImg, noImg]);
    assert.deepEqual(result, []);
  });

  it("more than 5 with photos → max 5", () => {
    const products = Array.from({ length: 8 }, (_, i) =>
      make({ id: `p${i}`, slug: `slug-${i}` }),
    );
    const result = slidesForFeaturedCarousel(products);
    assert.equal(result.length, 5);
  });

  it("respects custom max parameter", () => {
    const products = Array.from({ length: 4 }, (_, i) =>
      make({ id: `p${i}`, slug: `slug-${i}` }),
    );
    const result = slidesForFeaturedCarousel(products, 3);
    assert.equal(result.length, 3);
    assert.equal(result[0].id, "p0");
    assert.equal(result[1].id, "p1");
    assert.equal(result[2].id, "p2");
  });

  it("3 with photos + 2 without → 3 results", () => {
    const products = [
      make({ id: "a" }),
      make({ id: "no1", primaryImage: null }),
      make({ id: "b" }),
      make({ id: "no2", primaryImage: null }),
      make({ id: "c" }),
    ];
    const result = slidesForFeaturedCarousel(products);
    assert.equal(result.length, 3);
    assert.equal(result[0].id, "a");
    assert.equal(result[1].id, "b");
    assert.equal(result[2].id, "c");
  });

  it("does not read or format minPrice", () => {
    const products = [make({ id: "a", minPrice: 999 }), make({ id: "b", minPrice: 0 })];
    const result = slidesForFeaturedCarousel(products);
    assert.equal(result.length, 2);
    assert.equal(result[0].minPrice, 999);
    assert.equal(result[1].minPrice, 0);
  });
});
