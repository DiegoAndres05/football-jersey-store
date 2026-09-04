import { cn } from "@/lib/utils";
import { formatMoney } from "@/shared/money/format";
import type { CurrencyContext } from "@/shared/money/server-helpers";

export function ProductPrice({
  salePrice,
  compareAtPrice,
  size = "lg",
  currencyContext,
}: {
  salePrice: number;
  compareAtPrice: number | null;
  size?: "sm" | "lg";
  currencyContext?: CurrencyContext;
}) {
  const hasDiscount = compareAtPrice && compareAtPrice > salePrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - salePrice / compareAtPrice) * 100)
    : null;

  const format = (amountCop: number) =>
    formatMoney({
      amountCop,
      currency: currencyContext?.currency ?? "COP",
      copPerUsd: currencyContext?.copPerUsd ?? undefined,
    });

  return (
    <div className={cn("flex items-baseline gap-2", size === "lg" ? "text-3xl font-bold" : "text-lg font-semibold")}>
      <span>{format(salePrice)}</span>
      {hasDiscount && (
        <>
          <span className="text-muted-foreground line-through text-sm font-normal">
            {format(compareAtPrice)}
          </span>
          <span className="rounded-full bg-destructive/10 text-destructive text-xs font-semibold px-2 py-0.5">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
