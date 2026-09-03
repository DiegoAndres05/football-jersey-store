"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, X } from "lucide-react";
import { formatPriceShort } from "@/lib/utils";
import { useFavoritesStore } from "@/shared/stores/favorites-store";
import type { ResolvedLocalProduct } from "../types/local-product-reference-types";

export function FavoritesList({ products }: { products: ResolvedLocalProduct[] }) {
  const remove = useFavoritesStore((state) => state.removeFavorite);
  if (!products.length) return <div className="py-20 text-center"><Heart className="mx-auto mb-4 h-8 w-8 text-muted-foreground" /><h1 className="font-display text-3xl font-bold">Aún no tienes favoritos</h1><p className="mt-2 text-muted-foreground">Guarda camisetas para compararlas después.</p><Link href="/productos" className="mt-6 inline-block underline underline-offset-4">Explorar catálogo</Link></div>;
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <article key={product.productId} className="overflow-hidden rounded-xl border border-border bg-card"><Link href={`/productos/${product.slug}`} className="block"><div className="relative aspect-[3/4] bg-secondary">{product.imageUrl ? <Image src={product.imageUrl} alt={product.imageAlt} fill sizes="25vw" className="object-cover" /> : <span className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin imagen</span>}</div><div className="p-3"><h2 className="line-clamp-2 text-sm font-medium">{product.name}</h2>{product.minPrice !== null && <p className="mt-2 font-bold">Desde {formatPriceShort(product.minPrice)}</p>}<p className="mt-1 text-xs text-muted-foreground">{product.availability === "AVAILABLE" ? "Disponible" : "No disponible"}</p></div></Link><button type="button" aria-label={`Quitar ${product.name} de favoritos`} className="flex w-full items-center justify-center gap-2 border-t border-border p-2 text-xs hover:bg-accent" onClick={() => remove(product.productId)}><X className="h-3.5 w-3.5" /> Quitar</button></article>)}</div>;
}