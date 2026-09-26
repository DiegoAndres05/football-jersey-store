"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { productImageAlt } from "@/features/seo/domain/product-image-alt";
import { ProductImage } from "@/shared/ui/product-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ImageData = {
  id: string;
  url: string;
  altText: string | null;
  order: number;
  isPrimary: boolean;
};

type ProductData = {
  name: string;
  team?: { name: string } | null;
};

export function ProductGallery({
  images,
  product,
}: {
  images: ImageData[];
  product: ProductData;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const current = images[selectedIndex] ?? images[0];
  const currentAlt = current ? productImageAlt(current, product) : product.name;

  const goToIndex = useCallback((nextIndex: number) => {
    if (images.length <= 1) return;
    setSelectedIndex((nextIndex + images.length) % images.length);
  }, [images.length]);

  const onTouchStart = useCallback((event: React.TouchEvent<HTMLElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  }, []);

  const onTouchEnd = useCallback((event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX === null) return;
    const delta = touchStartX - (event.changedTouches[0]?.clientX ?? touchStartX);
    if (Math.abs(delta) > 40) {
      goToIndex(delta > 0 ? selectedIndex + 1 : selectedIndex - 1);
    }
    setTouchStartX(null);
  }, [goToIndex, selectedIndex, touchStartX]);

  const position = images.length > 1 ? `${selectedIndex + 1} de ${images.length}` : null;

  return (
    <div className="space-y-3 min-w-0">
      {current ? (
        <button
          type="button"
          aria-label={`Ampliar foto: ${currentAlt}`}
          onClick={() => setZoomOpen(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-xl bg-secondary"
        >
          <ProductImage
            src={current.url}
            alt={currentAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
            fallbackLabel="Sin imagen"
          />
        </button>
      ) : (
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
          <ProductImage src={undefined} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" fallbackLabel="Sin imagen" />
        </div>
      )}

      {images.length > 1 && (
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-[391px]:hidden">
            {images.map((img, i) => (
              <button
                key={img.id}
                aria-pressed={i === selectedIndex}
                aria-label={productImageAlt(img, product)}
                onClick={() => onThumbnailClick(i)}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  i === selectedIndex
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40",
                )}
              >
                <ProductImage
                  src={img.url}
                  alt={productImageAlt(img, product)}
                  fill
                  sizes="64px"
                  className="object-cover"
                  fallbackLabel="Sin imagen"
                />
              </button>
            ))}
          </div>
          <div aria-live="polite" className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {position}
          </div>
        </div>
      )}

      {current && (
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent aria-describedby={undefined} className="max-w-[min(calc(100vw-1rem),48rem)] bg-black p-2 pt-14 text-white">
            <DialogTitle className="sr-only">{currentAlt}</DialogTitle>
            <div
              className="relative aspect-[3/4] max-h-[80dvh] w-full"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <ProductImage src={current.url} alt={currentAlt} fill sizes="100vw" className="object-contain" fallbackLabel="Sin imagen" />
            </div>
            {position && <p aria-live="polite" className="py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-white/80">{position}</p>}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  function onThumbnailClick(index: number) {
    goToIndex(index);
  }
}
