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

  const seasonLabel = isMystery ? "Básica, Estándar o Premium" : product.season.name.trim();
  const versionLabel = isMystery
    ? ""
    : product.versionNames
        .map((name) => name.trim())
        .find((name) => name.length > 0 && name.toLowerCase() !== seasonLabel.toLowerCase()) ?? "";

  return (
    <article
      className={cn(
        "group flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#ece8e3] bg-white p-3",
        isSoldOut && "opacity-70",
      )}
    >
      <div className={cn("relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#f4f6f8]", isSoldOut && "grayscale")}>
        <Link href={href} className="absolute inset-0" aria-label={product.name}>
          <ProductImage
            src={product.primaryImage?.url}
            alt={product.primaryImage?.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn("object-cover object-center", isSoldOut && "grayscale")}
            priority={priority}
            fallbackLabel="Sin imagen"
          />
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex max-w-[calc(100%-3.25rem)] flex-wrap items-center gap-1.5">
          {offerPercent !== null && offerPercent > 0 && (
            <span className="rounded-full bg-black px-2.5 py-1 text-[11px] font-extrabold leading-none text-white [font-family:var(--font-ui-heavy),var(--font-sans)]">
              −{offerPercent}% OFF
            </span>
          )}
          {versionLabel && (
            <span className="rounded-full border border-[#e6e8ee] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.04em] text-[#1c2430]">
              {versionLabel}
            </span>
          )}
          {isOutlet && (
            <span className="rounded-full bg-[#fff6ea] px-2.5 py-1 text-[10px] font-semibold uppercase leading-none text-[#8a5a12]">
              Retro
            </span>
          )}
        </div>
        <button type="button" aria-label={favorite ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`} aria-pressed={favorite} onClick={() => toggleFavorite({ productId: product.id, slug: product.slug })} className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e6e8ee] bg-white text-[#3a3a3a] hover:bg-white"><Heart className={`h-4 w-4 ${favorite ? "fill-current text-red-600" : ""}`} /></button>
      </div>

      <Link href={href} className="mt-3.5 flex min-w-0 flex-1 flex-col px-1">
        <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a7]">
          {isMystery ? "Camiseta sorpresa" : product.team.name}
          {!isMystery && product.team.league && (
            <>
              <span aria-hidden> · </span>
              {product.team.league.name}
            </>
          )}
        </p>
        <h3 className="mt-1.5 min-w-0 break-words text-[16px] font-extrabold uppercase leading-[1.15] tracking-[-0.03em] line-clamp-2 text-[#121826] [font-family:var(--font-ui-heavy),var(--font-sans)]">
          {product.name}
        </h3>
        <p className="mt-1.5 text-[13px] text-[#8b93a7]">{seasonLabel}</p>
        {(isSoldOut || isBackorderOnly) && (
          <p className={cn("mt-1 text-[12px] font-semibold", isSoldOut ? "text-destructive" : "text-[#6e6a64]")}>
            {isSoldOut ? "Agotada" : "Bajo pedido · 15–20 días"}
          </p>
        )}
      </Link>

      {product.showPrice && product.displayPrice !== null && (
        <div className="mx-1 mt-3 border-t border-[#eceff3] pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a7]">
            {isSoldOut ? "Último precio" : "Precio"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="whitespace-nowrap text-[17px] font-extrabold leading-none tracking-[-0.04em] text-[#121826] [font-family:var(--font-ui-heavy),var(--font-sans)] md:text-[22px]">
              {formatPrice(product.displayPrice)}
            </p>
            {offerPercent !== null && product.compareAtPrice !== null && (
              <p className="whitespace-nowrap text-[13px] text-[#b0b6c3] line-through md:text-[14px]">{formatPrice(product.compareAtPrice)}</p>
            )}
          </div>
          {!isSoldOut && product.maxPrice > product.minPrice && (
            <p className="mt-1 text-xs text-[#8b93a7]">Hasta {formatPrice(product.maxPrice)}</p>
          )}
        </div>
      )}
    </article>
  );
}
