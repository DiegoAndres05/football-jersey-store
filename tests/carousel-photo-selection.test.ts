import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HOMEPAGE_CAROUSEL_MAX,
  toggleCarouselImageId,
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
