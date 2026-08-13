import { cn } from "@/lib/utils";

export function ProductPrice({
  salePrice,
  compareAtPrice,
  size = "lg",
}: {
  salePrice: number;
  compareAtPrice: number | null;
  size?: "sm" | "lg";
}) {
  const hasDiscount = compareAtPrice && compareAtPrice > salePrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - salePrice / compareAtPrice) * 100)
    : null;

  return (
    <div className={cn("flex items-baseline gap-2", size === "lg" ? "text-3xl font-bold" : "text-lg font-semibold")}>
      <span>${salePrice.toLocaleString("es-CO")}</span>
      {hasDiscount && (
        <>
          <span className="text-muted-foreground line-through text-sm font-normal">
            ${compareAtPrice.toLocaleString("es-CO")}
          </span>
          <span className="rounded-full bg-destructive/10 text-destructive text-xs font-semibold px-2 py-0.5">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
