import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const PAGE = "src/app/admin/(dashboard)/productos/page.tsx";
const PICKER = "src/features/products/components/homepage-carousel-picker.tsx";
const DASHBOARD_NAV = "src/app/admin/(dashboard)/layout.tsx";
const LEGACY_NAV = "src/components/layout/admin-layout.tsx";
const ACTION = "src/features/products/server/homepage-carousel-actions.ts";
const REPO = "src/features/products/repositories/homepage-carousel-repository.ts";

test("admin products page mounts HomepageCarouselPicker above the product list", () => {
  const page = readFileSync(PAGE, "utf8");
  const pickerIdx = page.indexOf("<HomepageCarouselPicker");
  const tableIdx = page.indexOf("<table");
  assert.ok(pickerIdx !== -1, "Expected HomepageCarouselPicker on productos page");
  assert.ok(tableIdx !== -1, "Expected product table");
  assert.ok(pickerIdx < tableIdx, "Picker must appear above the product list");
});

test("picker has a single Guardar button and clickable photos", () => {
  const picker = readFileSync(PICKER, "utf8");
  assert.match(picker, /Guardar/);
  assert.match(picker, /handleToggle|toggleCarouselImageId/);
  assert.match(picker, /Máximo/);
  assert.match(picker, /saveHomepageCarouselAction/);
  assert.match(picker, /No hay fotos de productos visibles/);
});

test("admin nav has no Carrusel item", () => {
  const dashboard = readFileSync(DASHBOARD_NAV, "utf8");
  const legacy = readFileSync(LEGACY_NAV, "utf8");
  assert.doesNotMatch(dashboard, /label:\s*"Carrusel"/);
  assert.doesNotMatch(legacy, /label:\s*"Carrusel"/);
  assert.doesNotMatch(dashboard, /\/admin\/carrusel/);
  assert.doesNotMatch(legacy, /\/admin\/carrusel/);
});

test("save action returns AdminSaveResult and rejects missing session", () => {
  const action = readFileSync(ACTION, "utf8");
  assert.match(action, /getSessionUser/);
  assert.match(action, /No autorizado/);
  assert.match(action, /AdminSaveResult/);
  assert.match(action, /revalidatePath\("\/"\)/);
  assert.match(action, /revalidatePath\("\/admin\/productos"\)/);
  assert.doesNotMatch(action, /throw new Error/);
});

test("eligible photos query only visible store products", () => {
  const repo = readFileSync(REPO, "utf8");
  assert.match(repo, /isActive:\s*true/);
  assert.match(repo, /homepage_carousel_image_ids/);
});

test("empty selection is allowed to persist", () => {
  const action = readFileSync(ACTION, "utf8");
  const picker = readFileSync(PICKER, "utf8");
  assert.match(action, /unique\.length > 0/);
  assert.match(picker, /saveHomepageCarouselAction\(selectedIds\)/);
});
