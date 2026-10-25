"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRecentlyViewedStore } from "@/shared/stores/recently-viewed-store";
import { resolveRecentlyViewedProducts } from "@/features/products/server/recently-viewed-actions";
import type { ProductCardData } from "../types/product-types";

export function RecentlyViewed() {
  const viewed = useRecentlyViewedStore((state) => state.viewed);
  const hydrated = useRecentlyViewedStore((state) => state.hydrated);
  const hydrate = useRecentlyViewedStore((state) => state.hydrate);
  const remove = useRecentlyViewedStore((state) => state.removeViewed);
  const [resolved, setResolved] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const ids = viewed.map((item) => item.productId);
    if (ids.length === 0) {
      setResolved([]);
      return;
    }
    let cancel = false;
    resolveRecentlyViewedProducts(ids)
      .then((cards) => {
        if (cancel) return;
        const found = new Set(cards.map((card) => card.id));
        for (const id of ids) {
          if (!found.has(id)) remove(id);
        }
        const byId = new Map(cards.map((card) => [card.id, card]));
        setResolved(
          ids.flatMap((id) => {
            const card = byId.get(id);
            return card ? [card] : [];
          }),
        );
      })
      .catch(() => {
        if (!cancel) setResolved([]);
      });
    return () => {
      cancel = true;
    };
  }, [hydrated, remove, viewed]);

  if (!hydrated || !resolved || resolved.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-title" className="mt-12 border-t border-border pt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recently-viewed-title" className="font-display text-2xl font-bold">
          Vistos recientemente
        </h2>
        <Link href="/productos#vistos-recientemente" className="text-sm underline underline-offset-4">
          Ver lista
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {resolved.slice(0, 4).map((product) => (
          <article key={product.id} className="relative">
            <Link href={`/productos/${product.slug}`} className="block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
                {product.primaryImage && (
                  <Image
                    src={product.primaryImage.url}
                    alt={product.primaryImage.altText ?? product.name}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm">{product.name}</p>
            </Link>
            <button
              type="button"
              aria-label={`Quitar ${product.name} de vistos recientemente`}
              onClick={() => remove(product.id)}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
            >
              <span aria-hidden>×</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
