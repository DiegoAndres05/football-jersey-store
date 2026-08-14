import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Star } from "lucide-react";
import {
  uploadProductImageAction,
  deleteProductImageAction,
  replaceProductImageAction,
  setPrimaryProductImageAction,
} from "@/features/products/server/image-actions";
import { getProductImageUrl } from "@/features/products/services/image-storage";

export const metadata: Metadata = {
  title: "Imágenes de producto · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductImagesPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { images: { orderBy: { order: "asc" } }, team: { select: { name: true } } },
  });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/productos"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Volver a productos
          </Link>
          <h2 className="mt-1 font-display text-lg font-bold uppercase tracking-tight">
            Imágenes · {product.name}
          </h2>
          <p className="text-sm text-muted-foreground">{product.team.name}</p>
        </div>
      </div>

      {/* Subir imagen */}
      <form
        action={uploadProductImageAction.bind(null, product.id)}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Subir imagen (JPG, PNG o WebP · máx 5 MB)
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-secondary-hover"
          />
          <input
            type="text"
            name="alt"
            placeholder="Texto alternativo (opcional)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]"
          >
            Subir
          </button>
        </div>
      </form>

      {/* Galería */}
      {product.images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Este producto no tiene imágenes todavía.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {product.images.map((img) => (
            <div key={img.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="relative aspect-[3/4] bg-secondary">
                <Image
                  src={getProductImageUrl(img.storagePath, img.url)}
                  alt={img.altText ?? img.url}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                {img.isPrimary && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                    <Star className="h-3 w-3" /> Principal
                  </span>
                )}
                {!img.storagePath && (
                  <span className="absolute right-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                    Externa
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="truncate text-xs text-muted-foreground">
                  {img.storagePath ?? img.url.slice(0, 48)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {!img.isPrimary && (
                    <form action={setPrimaryProductImageAction.bind(null, img.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                      >
                        Hacer principal
                      </button>
                    </form>
                  )}
                  {img.storagePath && (
                    <form
                      action={replaceProductImageAction.bind(null, img.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="file"
                        name="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        className="max-w-[9rem] text-xs file:rounded-md file:border file:border-border file:bg-secondary file:px-2 file:py-1 file:text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                      >
                        Reemplazar
                      </button>
                    </form>
                  )}
                  <form action={deleteProductImageAction.bind(null, img.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}