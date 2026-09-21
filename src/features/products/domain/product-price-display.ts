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
