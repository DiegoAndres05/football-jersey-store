import type { Prisma } from "@prisma/client";
import type { ProductFilters } from "../types/product-types";

export function buildProductWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const teamFilter: Prisma.TeamWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { team: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }
  if (filters.league) {
    teamFilter.league = { slug: filters.league };
  }
  if (filters.team) {
    teamFilter.slug = filters.team;
  }
  if (filters.season) {
    where.season = { slug: filters.season };
  }
  if (Object.keys(teamFilter).length > 0) {
    where.team = teamFilter;
  }

  if (filters.version || filters.size) {
    const variantFilters: Prisma.ProductVariantWhereInput[] = [];
    if (filters.version) {
      variantFilters.push({ version: { slug: filters.version } });
    }
    if (filters.size) {
      variantFilters.push({ size: { code: { equals: filters.size, mode: "insensitive" } } });
    }
    where.variants = { some: { AND: variantFilters } };
  }

  return where;
}