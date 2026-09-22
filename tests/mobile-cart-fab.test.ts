import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { shouldShowMobileCartFab } from "../src/features/cart/domain/mobile-cart-fab";

const cases: Array<{
  name: string;
  input: {
    itemCount: number;
    pathname: string;
    isCompactNav: boolean;
    isMobileMenuOpen: boolean;
  };
  expected: boolean;
}> = [
  {
    name: "hidden when the cart is empty",
    input: { itemCount: 0, pathname: "/", isCompactNav: true, isMobileMenuOpen: false },
    expected: false,
  },
  {
    name: "visible on a store page in compact nav with items",
    input: { itemCount: 2, pathname: "/productos", isCompactNav: true, isMobileMenuOpen: false },
    expected: true,
  },
  {
    name: "hidden on desktop width",
    input: { itemCount: 2, pathname: "/", isCompactNav: false, isMobileMenuOpen: false },
    expected: false,
  },
  {
    name: "hidden on the cart page",
    input: { itemCount: 2, pathname: "/carrito", isCompactNav: true, isMobileMenuOpen: false },
    expected: false,
  },
  {
    name: "hidden during checkout",
    input: { itemCount: 2, pathname: "/checkout", isCompactNav: true, isMobileMenuOpen: false },
    expected: false,
  },
  {
    name: "hidden on a nested checkout route",
    input: { itemCount: 1, pathname: "/checkout/pago", isCompactNav: true, isMobileMenuOpen: false },
    expected: false,
  },
  {
    name: "hidden while the mobile menu is open",
    input: { itemCount: 3, pathname: "/", isCompactNav: true, isMobileMenuOpen: true },
    expected: false,
  },
];

for (const scenario of cases) {
  test(scenario.name, () => {
    assert.equal(shouldShowMobileCartFab(scenario.input), scenario.expected);
  });
}

test("floating cart control links to the cart and stays under the mobile drawer", () => {
  const fab = readFileSync("src/features/cart/components/mobile-cart-fab.tsx", "utf8");
  const header = readFileSync("src/components/layout/header.tsx", "utf8");

  assert.match(fab, /lg:hidden/);
  assert.match(fab, /href="\/carrito"/);
  assert.match(fab, /z-\[var\(--z-navbar\)\]/);
  assert.match(fab, /hasHydrated|onFinishHydration/);
  assert.match(fab, /99\+/);
  assert.match(header, /<MobileCartFab isMobileMenuOpen=\{isMobileOpen\}/);
  assert.match(header, /href="\/carrito"/);
});
