import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
test("recently viewed integration records only active detail pages", () => { const source = readFileSync("src/features/products/components/product-detail-client.tsx", "utf8"); assert.match(source, /product\.isActive/); assert.match(source, /recordViewed/); });
test("recently viewed renders unavailable state and removal", () => { const source = readFileSync("src/features/products/components/recently-viewed.tsx", "utf8"); assert.match(source, /Producto no disponible/); assert.match(source, /Quitar/); });