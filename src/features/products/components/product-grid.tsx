import type { ProductCardData } from "@/features/products/types/product-types";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { ProductCard } from "./product-card";
import { EmptyState } from "./empty-state";

export function ProductGrid({
  products,
  priority = false,
  currencyContext,
  contextQuery,
}: {
  products: ProductCardData[];
  priority?: boolean;
  currencyContext?: CurrencyContext;
  contextQuery?: string;
}) {
  if (products.length === 0) {
    return <EmptyState variant="catalog" />;
  }

  return (
    <div className="grid min-w-0 grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={priority && i < 4} currencyContext={currencyContext} contextQuery={contextQuery} />
      ))}
    </div>
  );
}