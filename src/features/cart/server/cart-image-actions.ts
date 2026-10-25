"use server";

import { getPrimaryImageUrlBySlug } from "@/features/products/repositories/product-repository";

export async function getCartLineImage(slug: string) {
  try {
    if (typeof slug !== "string") return null;
    return await getPrimaryImageUrlBySlug(slug);
  } catch (error) {
    console.error("getCartLineImage failed:", error);
    return null;
  }
}
