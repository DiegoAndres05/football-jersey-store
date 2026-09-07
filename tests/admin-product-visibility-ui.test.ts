import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("admin products page offers hide-from-store and delete controls", () => {
  const page = readFileSync("src/app/admin/(dashboard)/productos/page.tsx", "utf8");
  const visibility = readFileSync("src/features/catalog/components/product-visibility-button.tsx", "utf8");
  assert.match(page, /ProductVisibilityButton/);
  assert.match(page, /ProductDeleteButton/);
  assert.match(visibility, /Ocultar de la tienda/);
});

test("admin variants page uses VariantDeleteButton instead of throwing form action", () => {
  const page = readFileSync("src/app/admin/(dashboard)/productos/[slug]/variantes/page.tsx", "utf8");
  assert.match(page, /VariantDeleteButton/);
  assert.doesNotMatch(page, /deleteVariantAction\.bind/);
});
