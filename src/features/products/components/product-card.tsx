import Link from "next/link";
import Image from "next/image";
import type { ProductCardData } from "@/features/products/types/product-types";
import { Badge } from "@/components/ui/badge";
import { formatPriceShort } from "@/lib/utils";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const isOutlet = product.season.isRetro;

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
          {product.availability === "OUT_OF_STOCK" && (
            <Badge tone="danger" size="sm">Agotada</Badge>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-3 gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
          {product.team.name}
          {product.season.isRetro ? ` · ${product.season.name}` : ""}
        </p>
        <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-foreground transition-colors">
          {product.name}
        </h3>

        <div className="mt-auto pt-2 flex items-baseline gap-1.5">
          <span className="text-sm text-muted-foreground">Desde</span>
          <span className="text-base font-bold">{formatPriceShort(product.minPrice)}</span>
          {product.maxPrice > product.minPrice && (
            <span className="text-xs text-muted-foreground">
              hasta {formatPriceShort(product.maxPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}