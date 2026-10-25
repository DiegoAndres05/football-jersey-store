"use server";

import { getActiveProductCardsByIds } from "@/features/products/repositories/product-repository";

export async function resolveRecentlyViewedProducts(ids: string[]) {
  return getActiveProductCardsByIds(ids);
}
