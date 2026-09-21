import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("admin coupon UI renders lifecycle data and does not expose internal usage fields", () => {
  const page = readFileSync("src/app/admin/(dashboard)/cupones/page.tsx", "utf8");
  assert.match(page, /Código/);
  assert.match(page, /Estado/);
  assert.match(page, /Usos/);
  assert.match(page, /Activo|Inactivo/);
  assert.doesNotMatch(page, /password|secret|sql/i);
});
