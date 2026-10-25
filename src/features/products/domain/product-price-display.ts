import type { Availability } from "../types/product-types";

export type ProductPriceDisplayState = {
  availability: Availability;
  displayPrice: number | null;
  statusLabel: "En stock" | "Bajo pedido" | "Agotado";
  showPrice: boolean;
};

export function deriveProductDisplayPrice(input: {
  availability: Availability;
  currentPrice?: number | null;
  lastValidProductPrice?: number | null;
}): ProductPriceDisplayState {
  const { availability, currentPrice, lastValidProductPrice } = input;
  const fallback = typeof lastValidProductPrice === "number" && lastValidProductPrice > 0
    ? Math.trunc(lastValidProductPrice)
    : null;
  const current = typeof currentPrice === "number" && currentPrice > 0
    ? Math.trunc(currentPrice)
    : null;

  if (availability === "OUT_OF_STOCK") {
    return { availability, displayPrice: fallback, showPrice: fallback !== null, statusLabel: "Agotado" };
  }
  if (availability === "ON_DEMAND") {
    return { availability, displayPrice: current ?? fallback, showPrice: (current ?? fallback) !== null, statusLabel: "Bajo pedido" };
  }
  return { availability, displayPrice: current ?? fallback, showPrice: (current ?? fallback) !== null, statusLabel: "En stock" };
}

export function displayedCompareAtPrice(input: {
  sizeSelected: boolean;
  selectedCompareAtPrice?: number | null;
  versionCompareAtPrices: Array<number | null>;
  salePrice?: number | null;
}): number | null {
  if (input.sizeSelected) return positivePrice(input.selectedCompareAtPrice);
  const sale = typeof input.salePrice === "number" && input.salePrice > 0 ? input.salePrice : null;
  return input.versionCompareAtPrices.map(positivePrice).find((price) => {
    if (price === null) return false;
    return sale === null || price > sale;
  }) ?? null;
}

export function discountPercent(salePrice: number | null, compareAtPrice: number | null): number | null {
  if (salePrice == null || compareAtPrice == null || salePrice <= 0 || compareAtPrice <= salePrice) return null;
  const percent = Math.round((1 - salePrice / compareAtPrice) * 100);
  return percent > 0 ? percent : null;
}

export function anchorVersionKey(
  variants: readonly { salePrice: number; versionAdjustment: number; versionKey: string }[],
): string | null {
  const priced = variants.filter((variant) => variant.salePrice > 0);
  if (priced.length === 0) return null;
  const minSale = Math.min(...priced.map((variant) => variant.salePrice));
  const atSale = priced.filter((variant) => variant.salePrice === minSale);
  const anchor = Math.min(...atSale.map((variant) => variant.versionAdjustment));
  return atSale.find((variant) => variant.versionAdjustment === anchor)?.versionKey ?? null;
}

function positivePrice(price: number | null | undefined): number | null {
  return typeof price === "number" && price > 0 ? Math.trunc(price) : null;
}

/**
 * Tachado de la tarjeta. El llamador pasa los compare-at de la versión ancla
 * (la del precio «Desde»), en orden de talla. Se usa el primero que supera
 * el precio de venta, no el máximo de otra versión.
 */
export function listingCompareAtPrice(input: {
  salePrice: number;
  compareAtPrices: Array<number | null | undefined>;
}): { compareAtPrice: number; discountPercent: number } | null {
  const compareAt = input.compareAtPrices
    .map(positivePrice)
    .find((price): price is number => price !== null && price > input.salePrice);
  const percent = discountPercent(input.salePrice, compareAt ?? null);
  if (!compareAt || percent === null) return null;
  return { compareAtPrice: compareAt, discountPercent: percent };
}

export function listingOfferFromVariants(input: {
  salePrice: number;
  variants: readonly {
    salePrice: number;
    compareAtPrice: number | null;
    versionAdjustment: number;
    sizePosition: number;
  }[];
}): { compareAtPrice: number; discountPercent: number } | null {
  const atSale = input.variants.filter((variant) => variant.salePrice === input.salePrice);
  if (atSale.length === 0) return null;
  const anchor = Math.min(...atSale.map((variant) => variant.versionAdjustment));
  const compareAtPrices = atSale
    .filter((variant) => variant.versionAdjustment === anchor)
    .sort((a, b) => a.sizePosition - b.sizePosition)
    .map((variant) => variant.compareAtPrice);
  return listingCompareAtPrice({ salePrice: input.salePrice, compareAtPrices });
}
