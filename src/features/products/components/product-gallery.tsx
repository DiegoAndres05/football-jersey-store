"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ImageData = {
  id: string;
  url: string;
  altText: string | null;
  order: number;
  isPrimary: boolean;
};

export function ProductGallery({ images }: { images: ImageData[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = images[selectedIndex] ?? images[0];

  const onThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  if (!images.length) {
    return (
      <div className="aspect-[3/4] rounded-xl bg-secondary flex items-center justify-center text-muted-foreground text-sm">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary">
        {current && (
          <Image
            src={current.url}
            alt={current.altText ?? "Imagen del producto"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => onThumbnailClick(i)}
              className={cn(
                "relative w-16 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                i === selectedIndex
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <Image
                src={img.url}
                alt={img.altText ?? ""}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
