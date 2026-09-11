export type ListingAvailability = "IN_STOCK" | "BACKORDER_ONLY" | "SOLD_OUT";

export type ListingVariantStock = {
  stock: number;
  allowsBackorder: boolean;
};

/**
 * Derived listing state for store product cards.
 * IN_STOCK: any variant with stock > 0
 * BACKORDER_ONLY: no stock, but some variant allows backorder
 * SOLD_OUT: not purchasable
 */
export function deriveListingAvailability(
  variants: readonly ListingVariantStock[],
): ListingAvailability {
  if (variants.some((v) => v.stock > 0)) return "IN_STOCK";
  if (variants.some((v) => v.allowsBackorder)) return "BACKORDER_ONLY";
  return "SOLD_OUT";
}

export function listingAvailabilityFromCardFlags(input: {
  availability: "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK";
  canBackorder: boolean;
}): ListingAvailability {
  if (input.availability === "AVAILABLE") return "IN_STOCK";
  if (input.availability === "ON_DEMAND") return "BACKORDER_ONLY";
  return input.canBackorder ? "BACKORDER_ONLY" : "SOLD_OUT";
}
