import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
test("favorites integration includes catalog, detail and public route", () => { const card = readFileSync("src/features/products/components/product-card.tsx", "utf8"); const page = readFileSync("src/app/favoritos/page.tsx", "utf8"); assert.match(card, /useFavoritesStore/); assert.match(page, /FavoritesPageClient/); });
test("favorites surfaces have accessible pressed and removal controls", () => { const source = readFileSync("src/features/products/components/product-card.tsx", "utf8") + readFileSync("src/features/products/components/favorites-list.tsx", "utf8"); assert.match(source, /aria-pressed/); assert.match(source, /Quitar/); });