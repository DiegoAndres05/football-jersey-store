import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const CART_SOURCE = readFileSync(
  "src/features/cart/components/cart-page-client.tsx",
  "utf8",
);

// ── State & library imports ──────────────────────────────────────────────────

test("cart page uses useCartStore for state", () => {
  assert.match(CART_SOURCE, /useCartStore/);
});

test("cart page uses Button from components/ui/button", () => {
  assert.match(CART_SOURCE, /components\/ui\/button/);
  assert.match(CART_SOURCE, /<Button/);
});

test("cart page exposes updateQuantity and removeItem controls", () => {
  assert.match(CART_SOURCE, /updateQuantity/);
  assert.match(CART_SOURCE, /removeItem/);
});

// ── Money ────────────────────────────────────────────────────────────────────

test("cart page uses formatMoney for all visible amounts", () => {
  assert.match(CART_SOURCE, /formatMoney/);
});

test("cart page does NOT use .toFixed(2) on prices", () => {
  assert.doesNotMatch(CART_SOURCE, /\.toFixed\(2\)/);
});

test("cart page does NOT contain hardcoded dollar prices", () => {
  assert.doesNotMatch(CART_SOURCE, /\$129\.99/);
});

// ── Checkout link ────────────────────────────────────────────────────────────

test("cart page has summary with Ir a pagar link to /checkout", () => {
  assert.match(CART_SOURCE, /Ir a pagar/);
  assert.match(CART_SOURCE, /\/checkout/);
});

// ── Empty state ──────────────────────────────────────────────────────────────

test("cart page has empty state with catalog link", () => {
  assert.match(CART_SOURCE, /Tu carrito está vacío/);
  assert.match(CART_SOURCE, /Ver catálogo/);
  assert.match(CART_SOURCE, /href="\/productos"/);
});

// ── Quantity controls ────────────────────────────────────────────────────────

test("minus button is disabled when quantity <= 1", () => {
  assert.match(CART_SOURCE, /disabled=\{item\.quantity\s*<=\s*1\}/);
});

test("minus button has aria-label for disminuir", () => {
  assert.match(CART_SOURCE, /aria-label="Disminuir cantidad"/);
});

test("removeItem is wired to the trash icon, not to minus", () => {
  assert.match(CART_SOURCE, /onClick=\{.*removeItem\(item\.lineId\)\}/);
  assert.match(CART_SOURCE, /Trash2/);
  const minusSection = CART_SOURCE.match(/Disminuir[\s\S]{0,500}/);
  if (minusSection) {
    assert.doesNotMatch(minusSection[0], /removeItem/);
  }
});

// ── Spanish copy & images ────────────────────────────────────────────────────

test("cart page renders next/image for product images", () => {
  assert.match(CART_SOURCE, /next\/image/);
  assert.match(CART_SOURCE, /<Image/);
});

test("cart page shows Spanish text for articles count", () => {
  assert.match(CART_SOURCE, /artículos/);
  assert.match(CART_SOURCE, /Tu carrito/);
});

// ── Negative assertions: forbidden content ───────────────────────────────────

test("cart page does NOT contain shoe demo content", () => {
  assert.doesNotMatch(CART_SOURCE, /Air Max/);
  assert.doesNotMatch(CART_SOURCE, /Ultra Boost/);
});

test("cart page does NOT import framer-motion", () => {
  assert.doesNotMatch(CART_SOURCE, /framer-motion/);
});

test("cart page does NOT import @number-flow/react", () => {
  assert.doesNotMatch(CART_SOURCE, /@number-flow\/react/);
});

// ── Transition classes (RED until TASK-005 / TASK-006) ────────────────────────

test("cart page uses duration-200 or transition- classes (RED until TASK-005/006)", () => {
  assert.ok(
    /duration-200|transition-/.test(CART_SOURCE),
    "Expected duration-200 or transition- class in cart source",
  );
});

test("cart page uses motion-reduce:transition-none (RED until TASK-005/006)", () => {
  assert.ok(
    /motion-reduce:transition-none/.test(CART_SOURCE),
    "Expected motion-reduce:transition-none class in cart source",
  );
});

// ── Layout contract (FR-007 / SC-004) ────────────────────────────────────────

test("cart page uses lg:grid-cols-[1fr_380px] for two-column layout", () => {
  assert.match(CART_SOURCE, /lg:grid-cols-\[1fr_380px\]/);
});

test("summary <aside> appears after line list in source/DOM order", () => {
  const lineListEnd = CART_SOURCE.indexOf("</div>", CART_SOURCE.indexOf("space-y-3"));
  const asideStart = CART_SOURCE.indexOf("<aside");
  assert.ok(lineListEnd > 0, "Line list div not found");
  assert.ok(asideStart > 0, "<aside> not found");
  assert.ok(
    asideStart > lineListEnd,
    "Expected <aside> to appear after the line list in source order",
  );
});

test("summary uses lg:sticky and lg:top-24 (sticky only from lg up)", () => {
  const asideMatch = CART_SOURCE.match(/<aside[^>]*>/);
  assert.ok(asideMatch, "No <aside> element found in cart source");
  assert.match(asideMatch![0], /lg:sticky/);
  assert.match(asideMatch![0], /lg:top-24/);
});

test("no fixed bottom pay bar (fixed + bottom on summary or pay button)", () => {
  const asideMatch = CART_SOURCE.match(/<aside[^>]*>/);
  assert.ok(asideMatch, "No <aside> element found in cart source");
  assert.doesNotMatch(
    asideMatch![0],
    /fixed.*bottom|bottom.*fixed/,
    "Summary aside must not have fixed+bottom positioning",
  );
  const hasFixedBottom = /className="[^"]*fixed[^"]*bottom[^"]*"/.test(CART_SOURCE);
  assert.ok(!hasFixedBottom, "Cart page must not contain a fixed-bottom pay bar");
});
