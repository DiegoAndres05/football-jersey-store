import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
test("size guide integration keeps purchase controls separate", () => { const source = readFileSync("src/features/products/components/product-detail-client.tsx", "utf8"); assert.match(source, /SizeGuideDialog/); assert.match(source, /AddToCartButton/); });
test("size guide UI exposes the agreed invitation and units", () => { const source = readFileSync("src/features/products/components/size-guide-dialog.tsx", "utf8"); assert.match(source, /¿No sabes qué talla eres\?/); assert.match(source, /Altura/); assert.match(source, /Peso/); });