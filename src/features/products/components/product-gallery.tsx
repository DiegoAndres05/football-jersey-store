"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { productImageAlt } from "@/features/seo/domain/product-image-alt";
import { ProductImage } from "@/shared/ui/product-image";

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
  const current = images[selectedIndex] ?? images[0];

  const goToIndex = useCallback((nextIndex: number) => {
    if (images.length <= 1) return;
    setSelectedIndex((nextIndex + images.length) % images.length);
  }, [images.length]);

  const onTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  }, []);

  const onTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const delta = touchStartX - (event.changedTouches[0]?.clientX ?? touchStartX);
    if (Math.abs(delta) > 40) {
      goToIndex(delta > 0 ? selectedIndex + 1 : selectedIndex - 1);
    }
    setTouchStartX(null);
  }, [goToIndex, selectedIndex, touchStartX]);

  return (
    <div className="space-y-3 min-w-0">
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ProductImage
          src={current?.url}
          alt={current ? productImageAlt(current, product) : product.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
          fallbackLabel="Sin imagen"
        />
      </div>

      {images.length > 1 && (
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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
            {selectedIndex + 1} de {images.length}
          </div>
        </div>
      )}
    </div>
  );

  function onThumbnailClick(index: number) {
    goToIndex(index);
  }
}
