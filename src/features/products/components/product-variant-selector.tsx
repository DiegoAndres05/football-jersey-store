"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Version = { id: string; slug: string; name: string; priceAdjustment: number };
type Size = { id: string; code: string; name: string; position: number };

export function ProductVariantSelector({
  versions,
  sizes,
  selectedVersion,
  selectedSize,
  onVersionChange,
  onSizeChange,
  getVariantAvailability,
  getVariantPrice,
}: {
  versions: Version[];
  sizes: Size[];
  selectedVersion: string;
  selectedSize: string;
  onVersionChange: (slug: string) => void;
  onSizeChange: (code: string) => void;
  getVariantAvailability: (versionSlug: string, sizeCode: string) => "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK";
  getVariantPrice: (versionSlug: string) => { salePrice: number; compareAtPrice: number | null };
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-2 block">Versión</label>
        <div className="flex flex-wrap gap-2">
          {versions.map((v) => {
            const isSelected = selectedVersion === v.slug;
            const price = getVariantPrice(v.slug);
            return (
              <button
                key={v.id}
                onClick={() => onVersionChange(v.slug)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border-2 px-4 py-2.5 text-sm transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-muted-foreground/40 text-foreground",
                )}
              >
                <span>{v.name}</span>
                <span className="text-xs text-muted-foreground">
                  ${(price.salePrice / 1000).toFixed(0)}K
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Talla</label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const isSelected = selectedSize === s.code;
            const availability = getVariantAvailability(selectedVersion, s.code);
            const isDisabled = availability === "OUT_OF_STOCK";

            return (
              <button
                key={s.id}
                onClick={() => !isDisabled && onSizeChange(s.code)}
                disabled={isDisabled}
                className={cn(
                  "h-10 min-w-[3rem] rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center px-3",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : isDisabled
                      ? "border-border/50 text-muted-foreground/40 line-through cursor-not-allowed"
                      : "border-border hover:border-muted-foreground/40",
                )}
              >
                {s.code}
                {availability === "ON_DEMAND" && isSelected && (
                  <Badge tone="warning" size="sm" className="ml-1.5">Pedido</Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
