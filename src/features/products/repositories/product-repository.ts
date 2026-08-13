import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  ProductCardData,
  ProductListResult,
  ProductFilters,
  ProductDetailData,
  VariantWithStock,
  LeagueData,
  TeamData,
  Availability,
  SortOption,
} from "../types/product-types";

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

const PAGE_SIZE = 24;

export async function getProducts(filters: ProductFilters): Promise<ProductListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = buildProductWhere(filters);
  const orderBy = buildProductOrderBy(filters.sort);

  const isPriceSort = filters.sort === "price-asc" || filters.sort === "price-desc";
  const hasAvailabilityFilter =
    filters.availability === "AVAILABLE" || filters.availability === "OUT_OF_STOCK";

  // El sort por precio y el filtro de disponibilidad requieren agregados
  // (min/max precio real y stock real del ledger), así que se calculan por
  // lote sobre los candidatos y la paginación se hace sobre los ids filtrados.
  if (isPriceSort || hasAvailabilityFilter) {
    const candidateIds = (
      await prisma.product.findMany({ where, select: { id: true }, orderBy })
    ).map((p) => p.id);

    const rangesByProductId = await getPriceRangesByProductIds(candidateIds);
    const stocksByProductId = hasAvailabilityFilter
      ? await getStocksByProductIds(candidateIds)
      : undefined;

    let allowedIds = candidateIds;

    if (hasAvailabilityFilter) {
      allowedIds = candidateIds.filter((id) => {
        const isAvailable = (stocksByProductId?.get(id) ?? []).some((stock) => stock > 0);
        return filters.availability === "AVAILABLE" ? isAvailable : !isAvailable;
      });
    }

    if (isPriceSort) {
      const dir = filters.sort === "price-asc" ? 1 : -1;
      allowedIds = [...allowedIds].sort((a, b) => {
        const priceA = rangesByProductId.get(a)?.min ?? 0;
        const priceB = rangesByProductId.get(b)?.min ?? 0;
        return (priceA - priceB) * dir;
      });
    }

    const total = allowedIds.length;
    const pageIds = allowedIds.slice(skip, skip + PAGE_SIZE);
    const products =
      pageIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: pageIds } },
            select: productCardSelect,
          })
        : [];
    const productsById = new Map(products.map((p) => [p.id, p]));
    const ordered = pageIds
      .map((id) => productsById.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
    const mapped = await mapProductCards(ordered, {
      rangesByProductId,
      stocksByProductId,
    });
    return { products: mapped, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, select: productCardSelect, skip, take: PAGE_SIZE, orderBy }),
    prisma.product.count({ where }),
  ]);

  const mapped = await mapProductCards(products);
  return { products: mapped, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getProductBySlug(slug: string): Promise<ProductDetailData | null> {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      team: {
        select: {
          id: true,
          slug: true,
          name: true,
          shortName: true,
          crestUrl: true,
          league: { select: { id: true, slug: true, name: true, country: true } },
        },
      },
      season: { select: { id: true, slug: true, name: true, isRetro: true } },
      images: {
        orderBy: { order: "asc" },
        select: { id: true, url: true, altText: true, order: true, isPrimary: true },
      },
      variants: {
        include: { version: true, size: true },
        orderBy: [{ version: { priceAdjustment: "asc" } }, { size: { position: "asc" } }],
      },
    },
  });

  if (!product) return null;

  const stockByVariantId = await getStockByVariantIds(product.variants.map((v) => v.id));
  const variantsWithStock: VariantWithStock[] = product.variants.map((v) => {
    const stock = stockByVariantId.get(v.id) ?? 0;
    return { ...v, stock, availability: computeAvailability(stock) };
  });

  return { ...product, variants: variantsWithStock };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    select: productCardSelect,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return mapProductCards(products);
}

export async function computeStock(variantId: string): Promise<number> {
  const result = await prisma.inventoryMovement.aggregate({
    where: { variantId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export function computeAvailability(
  stock: number | null,
): "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK" {
  if (stock === null) return "ON_DEMAND";
  if (stock > 0) return "AVAILABLE";
  return "OUT_OF_STOCK";
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

// ── Helpers ────────────────────────────────────────────────────────────────

function buildProductWhere(filters: ProductFilters): Prisma.ProductWhereInput {
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

  if (filters.version || filters.size) {
    const variantFilters: Prisma.ProductVariantWhereInput[] = [];
    if (filters.version) {
      variantFilters.push({ version: { slug: filters.version } });
    }
    if (filters.size) {
      variantFilters.push({ size: { code: filters.size } });
    }
    where.variants = { some: { AND: variantFilters } };
  }

  return where;
}

function buildProductOrderBy(sort?: SortOption): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "name-asc":
      return { name: "asc" };
    case "name-desc":
      return { name: "desc" };
    case "newest":
      return { createdAt: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

async function mapProductCards(
  products: Prisma.ProductGetPayload<{ select: typeof productCardSelect }>[],
  known?: {
    rangesByProductId?: Map<string, { min: number; max: number }>;
    stocksByProductId?: Map<string, number[]>;
  },
): Promise<ProductCardData[]> {
  const ids = products.map((p) => p.id);
  const [rangesByProductId, stocksByProductId] = await Promise.all([
    known?.rangesByProductId ??
      (ids.length > 0
        ? getPriceRangesByProductIds(ids)
        : Promise.resolve(new Map<string, { min: number; max: number }>())),
    known?.stocksByProductId ??
      (ids.length > 0
        ? getStocksByProductIds(ids)
        : Promise.resolve(new Map<string, number[]>())),
  ]);

  return products.map((p) => {
    const range = rangesByProductId.get(p.id) ?? { min: 0, max: 0 };
    const stocks = stocksByProductId.get(p.id) ?? [];
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
      minPrice: range.min,
      maxPrice: range.max,
      availability: availabilityFromStocks(stocks),
    } satisfies ProductCardData;
  });
}

function availabilityFromStocks(stocks: number[]): Availability {
  if (stocks.some((stock) => stock > 0)) return "AVAILABLE";
  return "OUT_OF_STOCK";
}

async function getPriceRangesByProductIds(
  productIds: string[],
): Promise<Map<string, { min: number; max: number }>> {
  if (productIds.length === 0) return new Map();
  const rows = await prisma.productVariant.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _min: { salePrice: true },
    _max: { salePrice: true },
  });
  return new Map(
    rows.map((r) => [
      r.productId,
      { min: r._min.salePrice ?? 0, max: r._max.salePrice ?? 0 },
    ]),
  );
}

async function getStockByVariantIds(variantIds: string[]): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const rows = await prisma.inventoryMovement.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds } },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [r.variantId, r._sum.quantity ?? 0]));
}

async function getStocksByProductIds(productIds: string[]): Promise<Map<string, number[]>> {
  if (productIds.length === 0) return new Map();
  const variants = await prisma.productVariant.findMany({
    where: { productId: { in: productIds } },
    select: { id: true, productId: true },
  });
  const stockByVariantId = await getStockByVariantIds(variants.map((v) => v.id));
  const byProduct = new Map<string, number[]>();
  for (const v of variants) {
    const stocks = byProduct.get(v.productId) ?? [];
    stocks.push(stockByVariantId.get(v.id) ?? 0);
    byProduct.set(v.productId, stocks);
  }
  return byProduct;
}