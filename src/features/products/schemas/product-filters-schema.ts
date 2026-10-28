import { z } from "zod";
import type { ProductFilters } from "../types/product-types";

export const productSortSchema = z.enum([
  "default",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
  "newest",
]);

/** AVAILABLE = comprable; OUT_OF_STOCK = agotada total (sin inmediata ni bajo pedido). */
export const productAvailabilitySchema = z.enum(["AVAILABLE", "OUT_OF_STOCK"]);

export const productDeliveryModeSchema = z.enum(["INMEDIATA", "BAJO_PEDIDO"]);

export const productFiltersParamsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  liga: z.string().max(500).optional(),
  equipo: z.string().max(60).optional(),
  temporada: z.string().max(60).optional(),
  version: z.string().max(60).optional(),
  talla: z.string().max(10).optional(),
  disponibilidad: productAvailabilitySchema.optional(),
  modalidad: productDeliveryModeSchema.optional(),
  precioMin: z.coerce.number().int().min(0).max(100_000_000).optional(),
  precioMax: z.coerce.number().int().min(0).max(100_000_000).optional(),
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

export function productFiltersFromParams(raw: ProductFiltersParams): ProductFilters {
  const filters: ProductFilters = {
    league: raw.liga,
    team: raw.equipo,
    season: raw.temporada,
    version: raw.version,
    size: raw.talla,
    availability: raw.disponibilidad,
    deliveryMode: raw.modalidad,
    search: raw.q,
    sort: raw.sort,
    page: raw.page ?? 1,
  };
  if (raw.precioMin != null && raw.precioMin > 0) filters.minPrice = raw.precioMin;
  if (raw.precioMax != null && raw.precioMax > 0) filters.maxPrice = raw.precioMax;
  if (
    filters.minPrice != null &&
    filters.maxPrice != null &&
    filters.minPrice > filters.maxPrice
  ) {
    const low = filters.maxPrice;
    filters.maxPrice = filters.minPrice;
    filters.minPrice = low;
  }
  return filters;
}