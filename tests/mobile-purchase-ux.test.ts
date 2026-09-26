import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { shouldShowPurchaseBar, isProductDetailPath } from "../src/features/products/domain/purchase-bar";
import { shouldShowMobileCartFab } from "../src/features/cart/domain/mobile-cart-fab";

const read = (path: string) => readFileSync(path, "utf8");

test("purchase bar is shown on a 390 px phone", () => {
  assert.equal(shouldShowPurchaseBar({ viewportWidth: 390 }), true);
  assert.equal(shouldShowPurchaseBar({ viewportWidth: 320 }), true);
  assert.equal(shouldShowPurchaseBar({ viewportWidth: 430 }), true);
});

test("purchase bar is not required at 768 px", () => {
  assert.equal(shouldShowPurchaseBar({ viewportWidth: 431 }), false);
  assert.equal(shouldShowPurchaseBar({ viewportWidth: 768 }), false);
});

test("purchase bar steps aside for the keyboard or an open dialog", () => {
  assert.equal(shouldShowPurchaseBar({ viewportWidth: 390, isKeyboardOpen: true }), false);
  assert.equal(shouldShowPurchaseBar({ viewportWidth: 390, isDialogOpen: true }), false);
});

test("product detail path matches a product page only", () => {
  assert.equal(isProductDetailPath("/productos/camiseta-local-2026"), true);
  assert.equal(isProductDetailPath("/productos"), false);
  assert.equal(isProductDetailPath("/productos/"), false);
  assert.equal(isProductDetailPath("/caja-misteriosa"), false);
});

test("product page mounts the purchase bar with the size prompt and safe area", () => {
  const detail = read("src/features/products/components/product-detail-client.tsx");
  const bar = read("src/features/products/components/product-purchase-bar.tsx");

  assert.match(detail, /<ProductPurchaseBar/);
  assert.match(detail, /onMissingSize: handleMissingSize/);
  assert.match(detail, /<AddToCartButton \{\.\.\.addToCartProps\}/);
  assert.match(bar, /Elige talla/);
  assert.match(bar, /safe-area-inset-bottom/);
  assert.match(bar, /shouldShowPurchaseBar/);
});

const fabCases: Array<{ name: string; pathname: string; viewportWidth: number; expected: boolean }> = [
  { name: "hidden on an order page", pathname: "/pedido/FS-1234", viewportWidth: 390, expected: false },
  { name: "hidden on the order root", pathname: "/pedido", viewportWidth: 390, expected: false },
  { name: "hidden on a product page at 390 px", pathname: "/productos/camiseta-local-2026", viewportWidth: 390, expected: false },
  { name: "hidden on a product page at 430 px", pathname: "/productos/camiseta-local-2026", viewportWidth: 430, expected: false },
  { name: "shown on a product page at 768 px", pathname: "/productos/camiseta-local-2026", viewportWidth: 768, expected: true },
  { name: "shown on the catalog at 390 px", pathname: "/productos", viewportWidth: 390, expected: true },
  { name: "shown on contact at 390 px", pathname: "/contacto", viewportWidth: 390, expected: true },
];

for (const scenario of fabCases) {
  test(`floating cart ${scenario.name}`, () => {
    assert.equal(
      shouldShowMobileCartFab({
        itemCount: 2,
        pathname: scenario.pathname,
        isCompactNav: true,
        isMobileMenuOpen: false,
        viewportWidth: scenario.viewportWidth,
      }),
      scenario.expected,
    );
  });
}

test("floating cart reads the viewport width and keeps a 44 px target", () => {
  const fab = read("src/features/cart/components/mobile-cart-fab.tsx");
  assert.match(fab, /viewportWidth/);
  assert.match(fab, /h-14 w-14/);
  assert.match(fab, /safe-area-inset-bottom/);
});

test("contact and public layout reserve room for the floating cart on mobile", () => {
  assert.match(read("src/app/contacto/page.tsx"), /pb-24[^"]*lg:pb-12/);
  assert.match(read("src/components/layout/footer.tsx"), /pb-28 lg:pb-12/);
});

test("cart line and checkout summary keep the name on two lines", () => {
  const cart = read("src/features/cart/components/cart-page-client.tsx");
  const checkout = read("src/features/checkout/components/checkout-page-client.tsx");

  assert.doesNotMatch(cart, /hover:underline line-clamp-1/);
  assert.match(cart, /line-clamp-2/);
  assert.doesNotMatch(checkout, /<p className="truncate font-medium">\{item\.productName\}/);
  assert.match(checkout, /line-clamp-2[^"]*">\{item\.productName\}/);
});

test("size and version controls declare a 44 px hit area", () => {
  const selector = read("src/features/products/components/product-variant-selector.tsx");

  assert.doesNotMatch(selector, /"h-10 min-w-\[3rem\]/);
  assert.match(selector, /min-h-11 min-w-11/);
  assert.match(selector, /flex flex-wrap gap-2/);
});

test("checkout at 390 px has no fixed width and a collapsed summary next to the button", () => {
  const checkout = read("src/features/checkout/components/checkout-page-client.tsx");

  assert.doesNotMatch(checkout, /\b(?:min-)?w-\[\d{3,}px\]/);
  assert.match(checkout, /lg:grid-cols-\[minmax\(0,1fr\)_380px\]/);
  assert.match(checkout, /mode: "onBlur"/);
  assert.match(checkout, /<details[^>]*data-testid="checkout-mobile-summary"/);
  assert.match(checkout, /min-\[431px\]:hidden/);
  assert.match(checkout, /Ver resumen/);
});
