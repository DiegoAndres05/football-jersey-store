import Link from "next/link";
import Image from "next/image";
import type { ProductCardData } from "@/features/products/types/product-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const availabilityConfig = {
  AVAILABLE: { label: "Disponible", tone: "success" as const },
  ON_DEMAND: { label: "Bajo pedido", tone: "warning" as const },
  OUT_OF_STOCK: { label: "Agotada", tone: "danger" as const },
};

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const av = availabilityConfig[product.availability];
  const isOutlet = product.season.isRetro;

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{product.team.name}</span>
          {product.team.league && (
            <>
              <span>·</span>
              <span>{product.team.league.name}</span>
            </>
          )}
        </div>

        <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold">
              ${(product.minPrice / 1000).toFixed(0).replace(/\.?0+$/, "")}K
            </span>
            {product.maxPrice > product.minPrice && (
              <span className="text-xs text-muted-foreground">
                – ${(product.maxPrice / 1000).toFixed(0)}K
              </span>
            )}
          </div>

          <Badge tone={av.tone} size="sm">
            {av.label}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
