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
    const leagueSlugs = filters.league.split(",").filter(Boolean);
    teamFilter.league = leagueSlugs.length > 1 ? { slug: { in: leagueSlugs } } : { slug: leagueSlugs[0] };
  }
  if (filters.team) {
    teamFilter.slug = filters.team;
  }
  if (filters.season) {
    where.season = { slug: filters.season };
  }
  if (Object.keys(teamFilter).length > 0) {
    where.team = teamFilter;
    where.productKind = { not: "MYSTERY_BOX" };
  }

  const hasPrice = filters.minPrice != null || filters.maxPrice != null;
  if (filters.version || filters.size || hasPrice) {
    const variantFilters: Prisma.ProductVariantWhereInput[] = [];
    if (filters.version) {
      variantFilters.push({ version: { slug: filters.version } });
    }
    if (filters.size) {
      variantFilters.push({ size: { code: { equals: filters.size, mode: "insensitive" } } });
    }
    if (hasPrice) {
      const salePrice: Prisma.IntFilter = {};
      if (filters.minPrice != null && filters.minPrice > 0) salePrice.gte = filters.minPrice;
      if (filters.maxPrice != null && filters.maxPrice > 0) salePrice.lte = filters.maxPrice;
      if (salePrice.gte == null) salePrice.gt = 0;
      variantFilters.push({ salePrice });
    }
    where.variants = { some: { AND: variantFilters } };
  }

  return where;
}