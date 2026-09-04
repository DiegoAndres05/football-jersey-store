import type { ProductCardData } from "@/features/products/types/product-types";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { ProductCard } from "./product-card";
import { EmptyState } from "./empty-state";

export function ProductGrid({
  products,
  priority = false,
  currencyContext,
}: {
  products: ProductCardData[];
  priority?: boolean;
  currencyContext?: CurrencyContext;
}) {
  if (products.length === 0) {
    return <EmptyState variant="catalog" />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={priority && i < 4} currencyContext={currencyContext} />
      ))}
    </div>
  );
}