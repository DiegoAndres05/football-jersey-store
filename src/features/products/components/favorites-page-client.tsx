"use client";
import { useEffect } from "react";
import { useFavoritesStore } from "@/shared/stores/favorites-store";
import { resolveLocalProductReferences } from "../services/local-product-references";
import { FavoritesList } from "./favorites-list";
import type { ProductCardData } from "../types/product-types";
import type { CurrencyContext } from "@/shared/money/server-helpers";

export function FavoritesPageClient({ products, currencyContext }: { products: ProductCardData[]; currencyContext?: CurrencyContext }) {
  const references = useFavoritesStore((state) => state.favorites);
  const hydrate = useFavoritesStore((state) => state.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return <FavoritesList products={resolveLocalProductReferences(references, products)} currencyContext={currencyContext} />;
}