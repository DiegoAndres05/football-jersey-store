import type { ProductCardData } from "@/features/products/types/product-types";
import { ProductCard } from "./product-card";
import { EmptyState } from "./empty-state";

export function ProductGrid({
  products,
  priority = false,
}: {
  products: ProductCardData[];
  priority?: boolean;
}) {
  if (products.length === 0) {
    return <EmptyState variant="catalog" />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={priority && i < 4} />
      ))}
    </div>
  );
}