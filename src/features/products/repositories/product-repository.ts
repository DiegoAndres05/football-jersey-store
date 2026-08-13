import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ProductCardData, ProductListResult, ProductFilters, ProductDetailData, VariantWithStock, LeagueData, TeamData } from "../types/product-types";

const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  kitType: true,
  brand: true,
  isFeatured: true,
  team: {
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      league: { select: { id: true, slug: true, name: true } },
    },
  },
  season: { select: { id: true, slug: true, name: true, isRetro: true } },
  images: {
    where: { isPrimary: true },
    select: { id: true, url: true, altText: true },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

export async function getProducts(filters: ProductFilters): Promise<ProductListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 24;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = { isActive: true };
  const teamFilter: Prisma.TeamWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
      { team: { name: { contains: filters.search } } },
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
  if (filters.version || filters.size || filters.availability) {
    where.variants = {};
    const variantFilters: Prisma.ProductVariantWhereInput[] = [];
    if (filters.version) {
      variantFilters.push({ version: { slug: filters.version } });
    }
    if (filters.size) {
      variantFilters.push({ size: { code: filters.size } });
    }
    if (variantFilters.length > 0) {
      where.variants.some = { AND: variantFilters };
    }
    if (filters.availability) {
      // Stock-based filtering is done post-query
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  switch (filters.sort) {
    case "price-asc": orderBy = { variants: { _count: "asc" } }; break;
    case "price-desc": orderBy = { variants: { _count: "desc" } }; break;
    case "name-asc": orderBy = { name: "asc" }; break;
    case "name-desc": orderBy = { name: "desc" }; break;
    case "newest": orderBy = { createdAt: "desc" }; break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productCardSelect,
      skip,
      take: pageSize,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const mapped = await Promise.all(
    products.map(async (p) => {
      const prices = await getProductPriceRange(p.id);
      const availability = await getWorstAvailability(p.id);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        shortName: p.shortName,
        kitType: p.kitType,
        brand: p.brand,
        isFeatured: p.isFeatured,
        team: p.team,
        season: p.season,
        primaryImage: p.images[0] ?? null,
        minPrice: prices.min,
        maxPrice: prices.max,
        availability,
      } satisfies ProductCardData;
    }),
  );

  return { products: mapped, total, page, totalPages };
}

async function getProductPriceRange(productId: string): Promise<{ min: number; max: number }> {
  const result = await prisma.productVariant.aggregate({
    where: { productId },
    _min: { salePrice: true },
    _max: { salePrice: true },
  });
  return {
    min: result._min.salePrice ?? 0,
    max: result._max.salePrice ?? 0,
  };
}

async function getWorstAvailability(productId: string): Promise<"AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK"> {
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  if (variants.length === 0) return "OUT_OF_STOCK";
  let hasAvailable = false;
  let hasOnDemand = false;
  for (const v of variants) {
    const stock = await computeStock(v.id);
    if (stock !== null && stock > 0) {
      hasAvailable = true;
    } else if (stock === null) {
      hasOnDemand = true;
    }
  }
  if (hasAvailable) return "AVAILABLE";
  if (hasOnDemand) return "ON_DEMAND";
  return "OUT_OF_STOCK";
}

export async function computeStock(variantId: string): Promise<number | null> {
  const result = await prisma.inventoryMovement.aggregate({
    where: { variantId },
    _sum: { quantity: true },
  });
  const total = result._sum.quantity ?? 0;
  return total;
}

export function computeAvailability(stock: number | null): "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK" {
  if (stock === null) return "ON_DEMAND";
  if (stock > 0) return "AVAILABLE";
  return "OUT_OF_STOCK";
}

export async function getProductBySlug(slug: string): Promise<ProductDetailData | null> {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      team: {
        select: { id: true, slug: true, name: true, shortName: true, crestUrl: true, league: { select: { id: true, slug: true, name: true, country: true } } },
      },
      season: { select: { id: true, slug: true, name: true, isRetro: true } },
      images: { orderBy: { order: "asc" }, select: { id: true, url: true, altText: true, order: true, isPrimary: true } },
      variants: {
        include: { version: true, size: true },
        orderBy: [{ version: { priceAdjustment: "asc" } }, { size: { position: "asc" } }],
      },
    },
  });

  if (!product) return null;

  const variantsWithStock: VariantWithStock[] = await Promise.all(
    product.variants.map(async (v) => {
      const stock = await computeStock(v.id);
      return { ...v, stock, availability: computeAvailability(stock) };
    }),
  );

  return { ...product, variants: variantsWithStock };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    select: productCardSelect,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    products.map(async (p) => {
      const prices = await getProductPriceRange(p.id);
      const availability = await getWorstAvailability(p.id);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        shortName: p.shortName,
        kitType: p.kitType,
        brand: p.brand,
        isFeatured: p.isFeatured,
        team: p.team,
        season: p.season,
        primaryImage: p.images[0] ?? null,
        minPrice: prices.min,
        maxPrice: prices.max,
        availability,
      };
    }),
  );
}

export async function getLeagues(): Promise<LeagueData[]> {
  const leagues = await prisma.league.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      country: true,
      teams: {
        select: {
          products: { where: { isActive: true }, select: { id: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return leagues.map((l) => ({
    id: l.id,
    slug: l.slug,
    name: l.name,
    country: l.country,
    productCount: l.teams.reduce((acc, t) => acc + t.products.length, 0),
  }));
}

export async function getTeamsByLeague(leagueSlug?: string): Promise<TeamData[]> {
  const where: Prisma.TeamWhereInput = {};
  if (leagueSlug) {
    where.league = { slug: leagueSlug };
  }
  const teams = await prisma.team.findMany({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      league: { select: { id: true, slug: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
  return teams;
}

export async function getSeasons() {
  return prisma.season.findMany({ orderBy: { year: "desc" } });
}

export async function getVersions() {
  return prisma.version.findMany({ orderBy: { priceAdjustment: "asc" } });
}

export async function getSizes() {
  return prisma.size.findMany({ orderBy: { position: "asc" } });
}
