"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import type { ProductCardData } from "@/features/products/types/product-types";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/shared/money/format";
import { useFavoritesStore } from "@/shared/stores/favorites-store";
import { listingAvailabilityFromCardFlags } from "@/features/products/domain/listing-availability";
import { cn } from "@/lib/utils";

export function ProductCard({ product, priority, currencyContext }: { product: ProductCardData; priority?: boolean; currencyContext?: CurrencyContext }) {
  const isOutlet = product.season.isRetro;
  const favorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const listing = listingAvailabilityFromCardFlags({
    availability: product.availability,
    canBackorder: product.canBackorder,
  });
  const isSoldOut = listing === "SOLD_OUT";
  const isBackorderOnly = listing === "BACKORDER_ONLY";

  const formatPrice = (amountCop: number) =>
    formatMoney({
      amountCop,
      currency: currencyContext?.currency ?? "COP",
      copPerUsd: currencyContext?.copPerUsd ?? undefined,
    });

  return (
    <Link
      href={`/productos/${product.slug}`}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSoldOut && "opacity-70",
      )}
    >
      <div className={cn("relative aspect-[3/4] bg-secondary overflow-hidden", isSoldOut && "grayscale")}>
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-105",
              isSoldOut && "grayscale",
            )}
            priority={priority}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Sin imagen
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutlet && (
            <Badge tone="warning" size="sm">Retro</Badge>
          )}
        </div>
        <button type="button" aria-label={favorite ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`} aria-pressed={favorite} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleFavorite({ productId: product.id, slug: product.slug }); }} className="absolute right-2 top-2 rounded-full bg-background/90 p-2 shadow-sm hover:bg-background"><Heart className={`h-4 w-4 ${favorite ? "fill-current text-red-600" : ""}`} /></button>
      </div>

      <div className="flex-1 flex flex-col p-3.5 gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
          {product.team.name}
          {product.team.league && (
            <>
              <span aria-hidden> · </span>
              {product.team.league.name}
            </>
          )}
        </p>

        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-muted-foreground">
          {product.season.name}
          {product.versionNames.length > 0 && (
            <>
              <span aria-hidden> · </span>
              {product.versionNames.join(" / ")}
            </>
          )}
        </p>

        <div className="mt-auto pt-2">
          {isSoldOut ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-destructive">
              Agotada
            </p>
          ) : isBackorderOnly ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-warning">
              Bajo pedido · 15–20 días
            </p>
          ) : product.availableSizes.length > 0 ? (
            <p className="text-[11px] tracking-wider text-muted-foreground">
              Tallas: <span className="text-foreground">{product.availableSizes.join(" · ")}</span>
            </p>
          ) : null}

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-sm text-muted-foreground">Desde</span>
            <span className="text-base font-bold">{formatPrice(product.minPrice)}</span>
            {product.maxPrice > product.minPrice && (
              <span className="text-xs text-muted-foreground">
                hasta {formatPrice(product.maxPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
