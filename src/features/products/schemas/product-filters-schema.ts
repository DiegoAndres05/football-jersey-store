import { z } from "zod";

export const productSortSchema = z.enum([
  "default",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
  "newest",
]);

export const productAvailabilitySchema = z.enum(["AVAILABLE", "OUT_OF_STOCK"]);

export const productFiltersParamsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  liga: z.string().max(60).optional(),
  temporada: z.string().max(60).optional(),
  version: z.string().max(60).optional(),
  talla: z.string().max(10).optional(),
  disponibilidad: productAvailabilitySchema.optional(),
  sort: productSortSchema.optional(),
  page: z.coerce.number().int().positive().max(1000).optional(),
});

export type ProductFiltersParams = z.infer<typeof productFiltersParamsSchema>;

export function parseProductFiltersParams(
  params: Record<string, string | string[] | undefined>,
): ProductFiltersParams {
  const parsed = productFiltersParamsSchema.safeParse(params);
  return parsed.success ? parsed.data : {};
}