import { deriveListingAvailability, type ListingVariantStock } from "./listing-availability";

/** Entrega inmediata y bajo pedido comparten prioridad. Agotada va al final. */
export function isSoldOutListing(variants: readonly ListingVariantStock[]): boolean {
  return deriveListingAvailability(variants) === "SOLD_OUT";
}

/** Mantiene el orden relativo dentro de cada grupo. */
export function sortPurchasableFirst<T>(items: readonly T[], isSoldOut: (item: T) => boolean): T[] {
  return items
    .map((item, index) => ({ item, index, rank: isSoldOut(item) ? 1 : 0 }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}
