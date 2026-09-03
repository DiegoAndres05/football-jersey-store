"use client";
import { useEffect } from "react";
import { useFavoritesStore } from "@/shared/stores/favorites-store";
import { resolveLocalProductReferences } from "../services/local-product-references";
import { FavoritesList } from "./favorites-list";
import type { ProductCardData } from "../types/product-types";

export function FavoritesPageClient({ products }: { products: ProductCardData[] }) {
  const references = useFavoritesStore((state) => state.favorites);
  const hydrate = useFavoritesStore((state) => state.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return <FavoritesList products={resolveLocalProductReferences(references, products)} />;
}