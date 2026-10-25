import { updateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG, PUBLIC_SETTINGS_TAG } from "./public-store";

/** Caduca el catálogo cacheado. Solo desde Server Actions. */
export function invalidatePublicCatalog() {
  updateTag(PUBLIC_CATALOG_TAG);
}

/** Caduca tarifas de envío y tasa USD cacheadas. Solo desde Server Actions. */
export function invalidatePublicSettings() {
  updateTag(PUBLIC_SETTINGS_TAG);
}
