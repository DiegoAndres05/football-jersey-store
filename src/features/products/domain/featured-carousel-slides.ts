import type { ProductCardData } from "../types/product-types";

export function slidesForFeaturedCarousel(
  products: ProductCardData[],
  max = 5,
): ProductCardData[] {
  const withImage = products.filter(
    (p) => p.primaryImage?.url,
  );

  if (withImage.length < 2) return [];

  return withImage.slice(0, max);
}
