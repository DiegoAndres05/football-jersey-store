import Image from "next/image";
import type { ProductCardData } from "@/features/products/types/product-types";

/**
 * Fotografía protagonista del hero: una única imagen de camisetas de la
 * base de datos, sin overlays ni tarjetas. Cuando exista la fotografía
 * oficial de la colección (varias camisetas colgadas), basta con
 * reemplazar la imagen del producto destacado o este contenedor.
 */
export function HeroProduct({ product }: { product: ProductCardData | null }) {
  const image = product?.primaryImage;
  const seasonYear = product?.season.name.replace(/^temporada\s*/i, "");

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-secondary shadow-[0_20px_50px_-24px_rgba(0,0,0,0.18)]">
      {image ? (
        <Image
          src={image.url}
          alt={image.altText ?? `${product?.name ?? "Camisetas"} de ${product?.team.name ?? "Flashsport"}`}
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

      {/* Etiqueta discreta de temporada */}
      <span className="absolute left-4 top-4 rounded-full bg-background/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur-sm">
        Temporada {seasonYear ?? "25/26"}
      </span>
    </div>
  );
}