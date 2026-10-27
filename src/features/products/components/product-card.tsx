"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { ProductCardData } from "@/features/products/types/product-types";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { formatMoney } from "@/shared/money/format";
import { useFavoritesStore } from "@/shared/stores/favorites-store";
import { listingAvailabilityFromCardFlags } from "@/features/products/domain/listing-availability";
import { discountPercent } from "@/features/products/domain/product-price-display";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/shared/ui/product-image";

export function ProductCard({ product, priority, currencyContext, contextQuery }: { product: ProductCardData; priority?: boolean; currencyContext?: CurrencyContext; contextQuery?: string }) {
  const isMystery = product.productKind === "MYSTERY_BOX";
  const isOutlet = !isMystery && product.season.isRetro;
  // Canonical route: href={`/productos/${product.slug}`}
  const jerseyHref = `/productos/${product.slug}` + (contextQuery ? `?${contextQuery}` : "");
  const href = isMystery ? "/caja-misteriosa" : jerseyHref;
  const favorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const listing = listingAvailabilityFromCardFlags({
    availability: product.availability,
    canBackorder: product.canBackorder,
  });
  const isSoldOut = listing === "SOLD_OUT";
  const isBackorderOnly = listing === "BACKORDER_ONLY";
  const offerPercent = product.showPrice
    ? discountPercent(product.displayPrice, product.compareAtPrice)
    : null;

  const formatPrice = (amountCop: number) =>
    formatMoney({
      amountCop,
      currency: currencyContext?.currency ?? "COP",
      copPerUsd: currencyContext?.copPerUsd ?? undefined,
    });

  const statusClass = isSoldOut
    ? "text-[12px] font-semibold text-destructive"
    : isBackorderOnly
      ? "rounded-full bg-[#f2f0ec] px-2.5 py-1 text-[11px] font-medium text-[#6e6a64]"
      : "text-[12px] font-semibold text-[#1f9d55]";
  const statusLabel = isSoldOut ? "Agotada" : isBackorderOnly ? "Bajo pedido" : "En stock";
  const seasonLabel = isMystery ? "Básica, Estándar o Premium" : product.season.name.trim();
  const versionLabel = isMystery
    ? ""
    : product.versionNames
        .map((name) => name.trim())
        .filter((name) => name.length > 0 && name.toLowerCase() !== seasonLabel.toLowerCase())
        .join(" / ");
  const sizeLabel =
    !isMystery && !isSoldOut && !isBackorderOnly && product.availableSizes.length > 0
      ? `Tallas ${product.availableSizes.join(" · ")}`
      : "";
  const detail = [seasonLabel, versionLabel, sizeLabel].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(
        "group flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#ece8e3] bg-white p-3",
        isSoldOut && "opacity-70",
      )}
    >
      <div className={cn("relative aspect-[5/4] overflow-hidden rounded-2xl bg-[#e6e3fb]", isSoldOut && "grayscale")}>
        <Link href={href} className="absolute inset-0" aria-label={product.name}>
          <ProductImage
            src={product.primaryImage?.url}
            alt={product.primaryImage?.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn("object-cover transition-transform duration-500 group-hover:scale-105", isSoldOut && "grayscale")}
            priority={priority}
            fallbackLabel="Sin imagen"
          />
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex max-w-[calc(100%-3rem)] flex-col items-start gap-1.5">
          {isOutlet && (
            <span className="max-w-full truncate rounded-full bg-[#fff6ea] px-2.5 py-1 text-[10px] font-semibold text-[#8a5a12]">
              Colección retro
            </span>
          )}
          {offerPercent !== null && offerPercent > 0 && (
            <span className="rounded-full bg-black px-2.5 py-1 text-[11px] font-extrabold leading-none text-white [font-family:var(--font-ui-heavy),var(--font-sans)]">
              −{offerPercent}%
            </span>
          )}
        </div>
        <button type="button" aria-label={favorite ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`} aria-pressed={favorite} onClick={() => toggleFavorite({ productId: product.id, slug: product.slug })} className="absolute right-1.5 top-1.5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#3a3a3a] hover:bg-white"><Heart className={`h-4 w-4 ${favorite ? "fill-current text-red-600" : ""}`} /></button>
      </div>

      <Link href={href} className="mt-3 flex min-w-0 flex-1 flex-col gap-1">
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a39e97]">
          {isMystery ? "Camiseta sorpresa" : product.team.name}
          {!isMystery && product.team.league && (
            <>
              <span aria-hidden> · </span>
              {product.team.league.name}
            </>
          )}
        </p>
        <h3 className="min-w-0 break-words text-[16px] font-extrabold leading-[1.15] tracking-[-0.02em] line-clamp-2 [font-family:var(--font-ui-heavy),var(--font-sans)]">
          {product.name}
        </h3>
        <p className="min-w-0 break-words text-[12.5px] leading-snug text-[#8a857f] line-clamp-2">
          {detail}
        </p>
        {isBackorderOnly && (
          <p className="text-[12.5px] leading-snug text-[#8a857f]">Bajo pedido · 15–20 días</p>
        )}
      </Link>

      {product.showPrice && product.displayPrice !== null && (
        <div className="mt-4">
          {offerPercent !== null && product.compareAtPrice !== null ? (
            <p className="text-[11px] text-[#b3ada6] line-through">{formatPrice(product.compareAtPrice)}</p>
          ) : (
            <p className="text-[11px] text-[#a39e97]">{isSoldOut ? "Último precio" : "Desde"}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <p className="min-w-0 text-[17px] font-extrabold leading-none tracking-[-0.03em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
              {formatPrice(product.displayPrice)}
            </p>
            <span className={cn("max-w-full", statusClass)}>{statusLabel}</span>
          </div>
          {!isSoldOut && product.maxPrice > product.minPrice && (
            <p className="mt-1 text-xs text-muted-foreground">Hasta {formatPrice(product.maxPrice)}</p>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={href} className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-[#e6e2dc] px-2 text-[11px] font-extrabold uppercase tracking-[0.04em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
          Detalles
        </Link>
        {isSoldOut ? (
          <span className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl bg-[#f3f1ed] px-2 text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#8a857f]">
            Agotada
          </span>
        ) : (
          <Link href={isMystery ? href : `${jerseyHref}#product-size-selector`} className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl bg-black px-2 text-[11px] font-extrabold uppercase tracking-[0.04em] text-white [font-family:var(--font-ui-heavy),var(--font-sans)]">
            Añadir
          </Link>
        )}
      </div>
    </article>
  );
}
