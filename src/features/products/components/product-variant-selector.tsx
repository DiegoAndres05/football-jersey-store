"use client";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/shared/money/format";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { fanPlayerDifferenceCopy, sharedFanPlayerPrice } from "@/features/products/domain/version-difference";

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
  currencyContext,
}: {
  versions: Version[];
  sizes: Size[];
  selectedVersion: string;
  selectedSize: string;
  onVersionChange: (slug: string) => void;
  onSizeChange: (code: string) => void;
  getVariantAvailability: (versionSlug: string, sizeCode: string) => "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK";
  getVariantPrice: (versionSlug: string) => { salePrice: number | null; compareAtPrice: number | null };
  currencyContext?: CurrencyContext;
}) {
  const pricedVersions = versions.map((version) => ({
    slug: version.slug,
    name: version.name,
    salePrice: getVariantPrice(version.slug).salePrice,
  }));
  const sharedPrice = sharedFanPlayerPrice(pricedVersions);
  const versionDifference = fanPlayerDifferenceCopy(pricedVersions);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-2 block">Versión</label>
        <div className="flex flex-wrap gap-2">
          {versions.map((v) => {
            const isSelected = selectedVersion === v.slug;
            const price = getVariantPrice(v.slug);
            const hideRepeatedPrice = sharedPrice !== null && price.salePrice === sharedPrice;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onVersionChange(v.slug)}
                className={cn(
                  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-4 py-2.5 text-sm transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-muted-foreground/40 text-foreground",
                )}
              >
                <span>{v.name}</span>
                {price.salePrice !== null && !hideRepeatedPrice && (
                  <span className="text-xs text-muted-foreground">
                    {formatMoney({ amountCop: price.salePrice, currency: currencyContext?.currency ?? "COP", copPerUsd: currencyContext?.copPerUsd ?? undefined })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {versionDifference && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{versionDifference}</p>
        )}
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
                type="button"
                onClick={() => !isDisabled && onSizeChange(s.code)}
                disabled={isDisabled}
                aria-label={availability === "ON_DEMAND" ? `${s.code}, bajo pedido` : s.code}
                className={cn(
                  "inline-flex h-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border-2 px-3 text-sm font-medium transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : isDisabled
                      ? "border-border/50 text-muted-foreground/40 line-through cursor-not-allowed"
                      : "border-border hover:border-muted-foreground/40",
                )}
              >
                {s.code}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
