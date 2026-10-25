"use server";

import { getPrimaryImageUrlBySlug } from "@/features/products/repositories/product-repository";

export async function getCartLineImage(slug: string) {
  return getPrimaryImageUrlBySlug(slug);
}
