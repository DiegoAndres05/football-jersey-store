import type { Metadata } from "next";
import { getProducts } from "@/features/products/repositories/product-repository";
import { FavoritesPageClient } from "@/features/products/components/favorites-page-client";
import { getCurrencyContext } from "@/shared/money/server-helpers";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const [result, currencyCtx] = await Promise.all([
    getProducts({ page: 1 }),
    getCurrencyContext(),
  ]);
  return <main className="container-page py-10"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Tu selección</p><h1 className="mt-2 font-display text-4xl font-bold uppercase">Favoritos</h1><div className="mt-8"><FavoritesPageClient products={result.products} currencyContext={currencyCtx} /></div></main>;
}