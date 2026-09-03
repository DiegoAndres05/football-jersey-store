"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/shared/stores/recently-viewed-store";
import type { ProductCardData } from "../types/product-types";
export function RecentlyViewed({ products }: { products: ProductCardData[] }) {
  const viewed = useRecentlyViewedStore((state) => state.viewed); const hydrate = useRecentlyViewedStore((state) => state.hydrate); const remove = useRecentlyViewedStore((state) => state.removeViewed);
  useEffect(() => { hydrate(); }, [hydrate]);
  const byId = new Map(products.map((product) => [product.id, product])); const items = viewed.map((item) => ({ item, product: byId.get(item.productId) }));
  if (!items.length) return null;
  return <section aria-labelledby="recently-viewed-title" className="mt-12 border-t border-border pt-8"><div className="mb-4 flex items-center justify-between"><h2 id="recently-viewed-title" className="font-display text-2xl font-bold">Vistos recientemente</h2><Link href="/productos#vistos-recientemente" className="text-sm underline underline-offset-4">Ver lista</Link></div><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.slice(0, 4).map(({ item, product }) => <article key={item.productId} className="relative">{product ? <Link href={`/productos/${product.slug}`} className="block"><div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">{product.primaryImage && <Image src={product.primaryImage.url} alt={product.primaryImage.altText ?? product.name} fill sizes="25vw" className="object-cover" />}</div><p className="mt-2 line-clamp-2 text-sm">{product.name}</p></Link> : <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-secondary p-3 text-center text-sm text-muted-foreground">Producto no disponible</div>}<button type="button" aria-label={`Quitar ${product?.name ?? "producto no disponible"} de vistos recientemente`} onClick={() => remove(item.productId)} className="absolute right-1 top-1 rounded-full bg-background/90 p-1"><span aria-hidden>×</span></button></article>)}</div></section>;
}