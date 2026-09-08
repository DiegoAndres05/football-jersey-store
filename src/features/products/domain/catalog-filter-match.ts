import {
  deriveListingAvailability,
  type ListingVariantStock,
} from "./listing-availability";

export type CatalogDeliveryModeFilter = "INMEDIATA" | "BAJO_PEDIDO";

export type CatalogVariantInfo = ListingVariantStock & {
  sizeCode: string;
};

export type CatalogFilterCriteria = {
  availability?: "AVAILABLE" | "OUT_OF_STOCK";
  deliveryMode?: CatalogDeliveryModeFilter;
  sizeCode?: string;
};

function normalizeSizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function isPurchasable(v: ListingVariantStock): boolean {
  return v.stock > 0 || v.allowsBackorder;
}

/**
 * Product matches catalog filters by intersection.
 * - AVAILABLE = purchasable (IN_STOCK or BACKORDER_ONLY)
 * - OUT_OF_STOCK = SOLD_OUT only (not backorder-only)
 * - INMEDIATA = some stock > 0 (scoped to size if set)
 * - BAJO_PEDIDO = some allowsBackorder (scoped to size if set; may also have stock)
 * - size alone = that size purchasable
 */
export function productMatchesCatalogFilters(
  variants: readonly CatalogVariantInfo[],
  criteria: CatalogFilterCriteria,
): boolean {
  const pool = criteria.sizeCode
    ? variants.filter(
        (v) => normalizeSizeCode(v.sizeCode) === normalizeSizeCode(criteria.sizeCode!),
      )
    : variants;

  if (criteria.sizeCode && pool.length === 0) return false;

  if (criteria.deliveryMode === "INMEDIATA" && !pool.some((v) => v.stock > 0)) {
    return false;
  }
  if (criteria.deliveryMode === "BAJO_PEDIDO" && !pool.some((v) => v.allowsBackorder)) {
    return false;
  }
  if (criteria.sizeCode && !criteria.deliveryMode && !pool.some(isPurchasable)) {
    return false;
  }

  if (criteria.availability === "OUT_OF_STOCK") {
    return deriveListingAvailability(variants) === "SOLD_OUT";
  }
  if (criteria.availability === "AVAILABLE") {
    if (!criteria.sizeCode && !criteria.deliveryMode) {
      return deriveListingAvailability(variants) !== "SOLD_OUT";
    }
    // Size/modality already constrained to a matching purchasable/mode pool
    return true;
  }

  return true;
}
