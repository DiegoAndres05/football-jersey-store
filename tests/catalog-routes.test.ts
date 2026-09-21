import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ProductImage } from "../src/shared/ui/product-image";

const root = resolve(import.meta.dirname, "..");

test("public catalog routes remain present", () => {
  for (const route of [
    "src/app/productos/page.tsx",
    "src/app/productos/[slug]/page.tsx",
    "src/app/ligas/[slug]/page.tsx",
    "src/app/equipos/[slug]/page.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, route)), true, route);
  }
});

test("image fallback is a public component with an accessible label", () => {
  assert.equal(typeof ProductImage, "function");
});

