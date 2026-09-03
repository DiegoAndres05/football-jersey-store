import assert from "node:assert/strict";
import test from "node:test";
import { useFavoritesStore } from "../src/shared/stores/favorites-store";

test("favorites toggle is unique and removable", () => {
  const store = useFavoritesStore.getState();
  store.clearFavorites();
  store.toggleFavorite({ productId: "p1", slug: "one", savedAt: 1 });
  store.toggleFavorite({ productId: "p1", slug: "one", savedAt: 2 });
  assert.equal(useFavoritesStore.getState().favorites.length, 0);
  store.removeFavorite("missing");
});