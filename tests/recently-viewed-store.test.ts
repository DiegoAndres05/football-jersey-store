import assert from "node:assert/strict";
import test from "node:test";
import { useRecentlyViewedStore } from "../src/shared/stores/recently-viewed-store";
test("recently viewed deduplicates and caps at twelve", () => {
  const store = useRecentlyViewedStore.getState(); store.clearViewed(); for (let i = 0; i < 13; i++) store.recordViewed({ productId: `p${i}`, slug: `p${i}`, lastViewedAt: i }); store.recordViewed({ productId: "p0", slug: "p0", lastViewedAt: 99 }); const viewed = useRecentlyViewedStore.getState().viewed; assert.equal(viewed.length, 12); assert.equal(viewed[0].productId, "p0");
});