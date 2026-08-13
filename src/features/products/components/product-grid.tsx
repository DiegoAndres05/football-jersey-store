import type { ProductCardData } from "@/features/products/types/product-types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  priority = false,
}: {
  products: ProductCardData[];
  priority?: boolean;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium">No encontramos camisetas con esos filtros.</p>
        <p className="text-sm text-muted-foreground mt-1">Intenta con otras opciones.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={priority && i < 4} />
      ))}
    </div>
  );
}
