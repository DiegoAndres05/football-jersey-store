"use server";

import { getProducts } from "@/features/products/repositories/product-repository";
import {
  parseProductFiltersParams,
  productFiltersFromParams,
} from "@/features/products/schemas/product-filters-schema";

export async function countFilteredProducts(query: Record<string, string>): Promise<number> {
  const filters = productFiltersFromParams(parseProductFiltersParams(query));
  const result = await getProducts({ ...filters, page: 1 });
  return result.total;
}
