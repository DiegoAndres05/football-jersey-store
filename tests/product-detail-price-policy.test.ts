import test from "node:test";
import assert from "node:assert/strict";
import { deriveProductDisplayPrice, displayedCompareAtPrice, discountPercent, listingCompareAtPrice, listingOfferFromVariants } from "../src/features/products/domain/product-price-display";

test("detail sold-out state is non-zero or hidden", () => {
  for (const lastValidProductPrice of [250000, null, 0, -1]) {
    const state = deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice });
    assert.notEqual(state.displayPrice, 0);
    assert.equal(state.statusLabel, "Agotado");
  }
});

test("detail fallback does not enable purchase", () => {
  const state = deriveProductDisplayPrice({ availability: "OUT_OF_STOCK", lastValidProductPrice: 220000 });
  assert.equal(state.availability, "OUT_OF_STOCK");
  assert.equal(state.displayPrice, 220000);
});

test("el precio tachado de la versión se muestra antes de elegir talla", () => {
  assert.equal(
    displayedCompareAtPrice({
      sizeSelected: false,
      versionCompareAtPrices: [280000, null],
    }),
    280000,
  );
});

test("sin precio tachado no se muestra", () => {
  assert.equal(
    displayedCompareAtPrice({
      sizeSelected: false,
      versionCompareAtPrices: [null, 0],
    }),
    null,
  );
});

test("con talla elegida solo cuenta el tachado de esa variante", () => {
  assert.equal(
    displayedCompareAtPrice({
      sizeSelected: true,
      selectedCompareAtPrice: null,
      versionCompareAtPrices: [280000],
    }),
    null,
  );
  assert.equal(
    displayedCompareAtPrice({
      sizeSelected: true,
      selectedCompareAtPrice: 310000,
      versionCompareAtPrices: [280000],
    }),
    310000,
  );
});

test("la tarjeta muestra el tachado de la variante que se vende como desde", () => {
  const offer = listingCompareAtPrice({
    salePrice: 95000,
    compareAtPrices: [149999, null, 90000],
  });
  assert.equal(offer?.compareAtPrice, 149999);
  assert.equal(offer?.discountPercent, 37);
});

test("la tarjeta no muestra tachado si no hay oferta", () => {
  assert.equal(listingCompareAtPrice({ salePrice: 95000, compareAtPrices: [95000, null] }), null);
});

test("catálogo y ficha usan el tachado de la versión del precio desde, no el máximo de otra versión", () => {
  const salePrice = 85000;
  const offer = listingOfferFromVariants({
    salePrice,
    variants: [
      { salePrice, compareAtPrice: 140000, versionAdjustment: 15000, sizePosition: 1 },
      { salePrice, compareAtPrice: 120000, versionAdjustment: 0, sizePosition: 3 },
      { salePrice, compareAtPrice: 120000, versionAdjustment: 0, sizePosition: 2 },
    ],
  });
  assert.equal(offer?.compareAtPrice, 120000);
  assert.equal(offer?.discountPercent, 29);
  assert.equal(discountPercent(salePrice, 120000), 29);
  assert.equal(discountPercent(salePrice, 140000), 39);
  assert.equal(listingCompareAtPrice({ salePrice, compareAtPrices: [120000, 140000] })?.compareAtPrice, 120000);
});
