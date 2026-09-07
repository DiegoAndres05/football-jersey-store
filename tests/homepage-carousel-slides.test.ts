import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  slidesForHomepageCarousel,
  type CarouselPhotoRecord,
} from "@/features/products/domain/homepage-carousel-slides";

function photo(
  overrides: Partial<CarouselPhotoRecord> & Pick<CarouselPhotoRecord, "id">,
): CarouselPhotoRecord {
  return {
    url: `https://img.test/${overrides.id}.jpg`,
    altText: null,
    productIsActive: true,
    slug: `slug-${overrides.id}`,
    name: `Product ${overrides.id}`,
    team: { name: "Team", league: { name: "League" } },
    ...overrides,
  };
}

function mapOf(...photos: CarouselPhotoRecord[]) {
  return new Map(photos.map((p) => [p.id, p]));
}

describe("slidesForHomepageCarousel", () => {
  it("0 usables → []", () => {
    assert.deepEqual(slidesForHomepageCarousel([], mapOf()), []);
  });

  it("1 usable → 1 slide (no min-2)", () => {
    const result = slidesForHomepageCarousel(["img1"], mapOf(photo({ id: "img1" })));
    assert.equal(result.length, 1);
    assert.equal(result[0].imageId, "img1");
    assert.equal(result[0].url, "https://img.test/img1.jpg");
  });

  it("omits missing ids, blank urls, and hidden products; keeps order of the rest", () => {
    const photos = mapOf(
      photo({ id: "keep-a" }),
      photo({ id: "hidden", productIsActive: false }),
      photo({ id: "blank", url: "   " }),
      photo({ id: "keep-b" }),
    );
    const result = slidesForHomepageCarousel(
      ["gone", "keep-a", "hidden", "blank", "keep-b"],
      photos,
    );
    assert.deepEqual(
      result.map((s) => s.imageId),
      ["keep-a", "keep-b"],
    );
  });

  it("two photos of the same product become two slides with distinct imageIds", () => {
    const photos = mapOf(
      photo({ id: "front", slug: "madrid", name: "Madrid" }),
      photo({ id: "back", slug: "madrid", name: "Madrid" }),
    );
    const result = slidesForHomepageCarousel(["front", "back"], photos);
    assert.equal(result.length, 2);
    assert.equal(result[0].imageId, "front");
    assert.equal(result[1].imageId, "back");
    assert.equal(result[0].slug, "madrid");
    assert.equal(result[1].slug, "madrid");
  });

  it("does not copy price fields onto slides", () => {
    const result = slidesForHomepageCarousel(["img1"], mapOf(photo({ id: "img1" })));
    assert.equal("minPrice" in result[0], false);
    assert.equal("maxPrice" in result[0], false);
  });

  it("empty saved list is valid and yields no slides", () => {
    const result = slidesForHomepageCarousel([], mapOf(photo({ id: "img1" })));
    assert.deepEqual(result, []);
  });
});
