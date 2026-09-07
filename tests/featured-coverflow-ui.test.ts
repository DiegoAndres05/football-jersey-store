import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const COMPONENT_PATH = "src/features/products/components/featured-coverflow-carousel.tsx";
const PAGE_PATH = "src/app/page.tsx";

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, "utf8");
}

function readPage(): string {
  return readFileSync(PAGE_PATH, "utf8");
}

// ── Component source asserts ────────────────────────────────────────────────

test("coverflow component file exists", () => {
  readComponent();
});

test("component exports FeaturedCoverflowCarousel", () => {
  const source = readComponent();
  assert.match(source, /FeaturedCoverflowCarousel/);
});

test("CTA text is Ver camiseta", () => {
  const source = readComponent();
  assert.match(source, /Ver camiseta/);
});

test("CTA href contains /productos/", () => {
  const source = readComponent();
  assert.match(source, /\/productos\//);
});

test("Button imported from @/components/ui/button", () => {
  const source = readComponent();
  assert.match(source, /from\s+["']@\/components\/ui\/button["']/);
});

test("uses lucide ChevronLeft and ChevronRight", () => {
  const source = readComponent();
  assert.match(source, /ChevronLeft/);
  assert.match(source, /ChevronRight/);
});

test("uses next/image", () => {
  const source = readComponent();
  assert.match(source, /next\/image/);
});

test("Spanish eyebrow: Destacadas or similar, not BEST SELLERS / View Menu", () => {
  const source = readComponent();
  assert.doesNotMatch(source, /BEST SELLERS/i);
  assert.doesNotMatch(source, /View Menu/i);
  // Must have a Spanish label — Destacadas or similar
  assert.ok(
    /Destacadas|Destacado|Featured|Nuestras/i.test(source),
    "Expected a Spanish eyebrow like 'Destacadas' in component",
  );
});

test("no restaurant demo artifacts in component", () => {
  const source = readComponent();
  assert.doesNotMatch(source, /Butter Chicken/);
  assert.doesNotMatch(source, /defaultDishes/);
  assert.doesNotMatch(source, /cdn\.21st\.dev/);
});

test("component does not render minPrice or formatMoney", () => {
  const source = readComponent();
  assert.doesNotMatch(source, /minPrice/);
  assert.doesNotMatch(source, /formatMoney/);
});

test("autoplay interval ~5000ms", () => {
  const source = readComponent();
  assert.match(
    source,
    /5000|5_000/,
    "Expected autoplay interval around 5000ms",
  );
});

test("pauses on hover or focus", () => {
  const source = readComponent();
  assert.ok(
    /onMouseEnter|onFocus|onpointerenter|autoplay.*pause|isPaused/.test(source),
    "Expected pause-on-hover or pause-on-focus behaviour in component",
  );
});

// ── Page placement asserts ──────────────────────────────────────────────────

test("page file exists and can be read", () => {
  readPage();
});

test("page loads homepage carousel slides, not featured products", () => {
  const page = readPage();
  assert.match(page, /getHomepageCarouselSlides/);
  assert.doesNotMatch(page, /slidesForFeaturedCarousel/);
});

test("page mounts coverflow when there is at least one slide", () => {
  const page = readPage();
  assert.match(page, /coverflowSlides\.length\s*>=\s*1/);
  assert.doesNotMatch(page, /coverflowSlides\.length\s*>=\s*2/);
});

test("carousel placement: after trust bar and before Las grandes ligas", () => {
  const page = readPage();
  const trustIdx = page.indexOf("TRUST BAR");
  const leaguesIdx = page.indexOf("Las grandes ligas");
  // At minimum the trust bar and leagues section must exist
  assert.ok(trustIdx !== -1, "Trust bar section must exist in page");
  assert.ok(leaguesIdx !== -1, "Las grandes ligas section must exist in page");
  assert.ok(
    trustIdx < leaguesIdx,
    "Trust bar must appear before Las grandes ligas",
  );
});

test("page does not contain restaurant demo artifacts", () => {
  const page = readPage();
  assert.doesNotMatch(page, /Butter Chicken/);
  assert.doesNotMatch(page, /defaultDishes/);
  assert.doesNotMatch(page, /cdn\.21st\.dev/);
});

test("coverflow renders a single slide instead of returning null", () => {
  const source = readComponent();
  assert.doesNotMatch(source, /if \(total < 2\) return null/);
  assert.match(source, /item\.imageId/);
  assert.match(source, /item\.url/);
  assert.doesNotMatch(source, /primaryImage/);
});
