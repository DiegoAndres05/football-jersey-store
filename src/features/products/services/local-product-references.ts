import type { ProductCardData } from "../types/product-types";
import type { FavoriteReference, LocalProductReference, ResolvedLocalProduct } from "../types/local-product-reference-types";

export function resolveLocalProductReferences(references: LocalProductReference[], products: ProductCardData[]): ResolvedLocalProduct[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return references.map((reference) => {
    const product = byId.get(reference.productId);
    if (!product) return { ...reference, name: "Producto no disponible", imageUrl: null, imageAlt: "Producto no disponible", minPrice: null, availability: "NOT_FOUND" };
    return { ...reference, name: product.name, imageUrl: product.primaryImage?.url ?? null, imageAlt: product.primaryImage?.altText ?? product.name, minPrice: product.minPrice, availability: product.availability };
  });
}

export function isLocalReference(value: unknown): value is FavoriteReference {
  return Boolean(value && typeof value === "object" && typeof (value as FavoriteReference).productId === "string" && typeof (value as FavoriteReference).slug === "string");
}