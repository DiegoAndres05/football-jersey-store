import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCardData } from "@/features/products/types/product-types";
import { formatPriceShort } from "@/lib/utils";

/**
 * Fotografía de producto protagonista del hero: una camiseta principal en
 * primer plano con dos camisetas secundarias a la vista, como en la
 * referencia de tienda. Usa imágenes reales de la base de datos; cuando
 * existan fotografías de marca propias, basta con reemplazar las imágenes
 * de los productos (la estructura no cambia).
 */
export function HeroProduct({
  product,
  secondary = [],
}: {
  product: ProductCardData | null;
  secondary?: ProductCardData[];
}) {
  const image = product?.primaryImage;
  const thumbs = secondary.slice(0, 2);

  return (
    <div className="relative">
      {/* Panel principal */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-secondary shadow-[0_20px_50px_-20px_rgba(0,0,0,0.22)]">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? `${product?.name ?? "Camiseta"} de ${product?.team.name ?? ""}`}
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 45vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary">
            <span
              aria-hidden
              className="font-display text-8xl font-bold uppercase leading-none text-muted select-none opacity-40"
            >
              FS
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Fotografía de producto próximamente
            </p>
          </div>
        )}

        {/* Badge de temporada */}
        <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-background backdrop-blur-sm">
          Temporada {product?.season.name ?? "25/26"}
        </span>

        {/* Barra inferior con datos del producto */}
        {product && (
          <Link
            href={`/productos/${product.slug}`}
            className="group absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/90 px-4 py-3 backdrop-blur-sm transition-colors hover:border-foreground/30"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">
                {product.name}
              </span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Desde {formatPriceShort(product.minPrice)}
              </span>
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        )}
      </div>

      {/* Camisetas secundarias a la vista */}
      {thumbs.length > 0 && (
        <div className="absolute right-3 top-3 hidden gap-2.5 sm:flex">
          {thumbs.map((p, i) => (
            <Link
              key={p.id}
              href={`/productos/${p.slug}`}
              className={`group relative block w-24 overflow-hidden rounded-lg border border-border bg-background shadow-[0_14px_32px_-14px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-1 lg:w-28 ${
                i === 1 ? "mt-6" : ""
              }`}
            >
              <div className="relative aspect-[3/4] bg-secondary">
                {p.primaryImage ? (
                  <Image
                    src={p.primaryImage.url}
                    alt={p.primaryImage.altText ?? `${p.name} de ${p.team.name}`}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    FS
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em]">
                  {p.shortName ?? p.team.name}
                </p>
                <p className="text-[10px] font-bold tabular-nums">
                  {formatPriceShort(p.minPrice)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
