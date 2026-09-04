"use server";

import { z } from "zod";
import { getImmediateStockByVariantIds as loadImmediateStock } from "@/features/products/repositories/product-repository";

const variantIdsSchema = z.array(z.string().min(1).max(128)).max(80);

/**
 * Stock físico vigente para las variantes del carrito del visitante.
 * Ids desconocidos o vacíos se tratan como stock 0.
 */
export async function getImmediateStockByVariantIds(
  variantIds: string[],
): Promise<{ variantId: string; stock: number }[]> {
  const parsed = variantIdsSchema.safeParse(variantIds);
  if (!parsed.success) return [];
  return loadImmediateStock(parsed.data);
}
