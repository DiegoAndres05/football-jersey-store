import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductCardData } from "@/features/products/types/product-types";
import { formatPriceShort } from "@/lib/utils";

/**
 * Protagonista visual del hero: la fotografía del producto es el elemento
 * central. Usa la primera imagen real del producto destacado de la base de
 * datos; cuando existan fotografías de marca propias, basta con reemplazar
 * las imágenes del producto (la estructura no cambia).
 */
export function HeroProduct({ product }: { product: ProductCardData | null }) {
  const image = product?.primaryImage;

  return (
    <div className="relative lg:pl-8">
      {/* Número de temporada gigante (elemento gráfico de fondo) */}
      <span
        aria-hidden
        className="hidden lg:block absolute -top-10 -right-2 font-display text-[11rem] xl:text-[13rem] font-bold uppercase leading-none text-outline-faint select-none pointer-events-none whitespace-nowrap -z-0"
      >
        25/26
      </span>

      <div className="relative z-10 -rotate-1 hover:rotate-0 transition-transform duration-500">
        {/* Panel fotográfico */}
        <div className="relative aspect-[4/5] w-full overflow-hidden border border-foreground/15 bg-card shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]">
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
                className="font-display text-9xl font-bold uppercase leading-none text-muted select-none opacity-40"
              >
                FS
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Fotografía de producto próximamente
              </p>
            </div>
          )}

          {/* Cinta superior con metadata editorial */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-foreground/85 backdrop-blur-sm text-background">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
              {product ? `${product.team.name} · ${product.season.name}` : "Edición 25/26"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
              Local · Visitante · Retro
            </span>
          </div>

          {/* Pie superpuesto con datos del producto */}
          {product && (
            <Link
              href={`/productos/${product.slug}`}
              className="group absolute bottom-0 left-0 right-0 flex items-center justify-between gap-3 px-4 py-4 bg-background/90 backdrop-blur-sm border-t border-border"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold leading-tight">
                  {product.name}
                </span>
                <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Desde {formatPriceShort(product.minPrice)}
                </span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Nota de colección bajo el panel */}
      <p className="mt-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        <span>Flashsport — Colección 01</span>
        <span>No. 001</span>
      </p>
    </div>
  );
}