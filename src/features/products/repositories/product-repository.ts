import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { PUBLIC_CATALOG_TAG, PUBLIC_READ_REVALIDATE_SECONDS } from "@/shared/cache/public-store";
import { buildProductWhere } from "./product-where";
import { productMatchesCatalogFilters } from "../domain/catalog-filter-match";
import { isSoldOutListing, sortPurchasableFirst } from "../domain/catalog-listing-order";
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
import { deriveProductDisplayPrice, listingCompareAtPrice } from "../domain/product-price-display";
import { MYSTERY_BOX_SLUG, mysteryBoxTier } from "../domain/mystery-box";

const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  kitType: true,
  brand: true,
  isFeatured: true,
  productKind: true,
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
    select: { id: true, url: true, altText: true },
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
    take: 1,
  },
} satisfies Prisma.ProductSelect;

const PAGE_SIZE = 24;

function cacheCatalog<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  key: string,
) {
  return unstable_cache(fn, [key], {
    revalidate: PUBLIC_READ_REVALIDATE_SECONDS,
    tags: [PUBLIC_CATALOG_TAG],
  });
}

async function loadProducts(filters: ProductFilters): Promise<ProductListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = buildProductWhere(filters);
  const orderBy = buildProductOrderBy(filters.sort);
  const isPriceSort = filters.sort === "price-asc" || filters.sort === "price-desc";
  const hasAvailabilityFilter =
    filters.availability === "AVAILABLE" || filters.availability === "OUT_OF_STOCK";
  const hasDeliveryModeFilter =
    filters.deliveryMode === "INMEDIATA" || filters.deliveryMode === "BAJO_PEDIDO";
  const hasPurchasableSizeFilter = Boolean(filters.size);

  const candidateIds = (
    await prisma.product.findMany({ where, select: { id: true }, orderBy })
  ).map((product) => product.id);

  const [rangesByProductId, variantInfosByProductId] = await Promise.all([
    isPriceSort ? getPriceRangesByProductIds(candidateIds) : Promise.resolve(undefined),
    getVariantInfosByProductIds(candidateIds),
  ]);

  let allowedIds = candidateIds;
  if (hasAvailabilityFilter || hasDeliveryModeFilter || hasPurchasableSizeFilter) {
    allowedIds = candidateIds.filter((id) =>
      productMatchesCatalogFilters(variantInfosByProductId.get(id) ?? [], {
        availability:
          filters.availability === "AVAILABLE" || filters.availability === "OUT_OF_STOCK"
            ? filters.availability
            : undefined,
        deliveryMode: filters.deliveryMode,
        sizeCode: filters.size,
      }),
    );
  }

  if (isPriceSort && rangesByProductId) {
    const dir = filters.sort === "price-asc" ? 1 : -1;
    allowedIds = [...allowedIds].sort((a, b) => {
      const priceA = rangesByProductId.get(a)?.min ?? 0;
      const priceB = rangesByProductId.get(b)?.min ?? 0;
      return (priceA - priceB) * dir;
    });
  }

  allowedIds = sortPurchasableFirst(allowedIds, (id) =>
    isSoldOutListing(variantInfosByProductId.get(id) ?? []),
  );

  const total = allowedIds.length;
  const pageIds = allowedIds.slice(skip, skip + PAGE_SIZE);
  const products =
    pageIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: pageIds } },
          select: productCardSelect,
        })
      : [];
  const productsById = new Map(products.map((product) => [product.id, product]));
  const ordered = pageIds
    .map((id) => productsById.get(id))
    .filter((product): product is NonNullable<typeof product> => product !== undefined);
  const mapped = await mapProductCards(ordered, {
    rangesByProductId,
    variantInfosByProductId,
  });
  return { products: mapped, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export const getProducts = cacheCatalog(loadProducts, "public-products-v1");

async function loadProductBySlug(slug: string): Promise<ProductDetailData | null> {
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
          players: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, number: true },
          },
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
    return { ...v, stock, availability: computeAvailability(stock, v.allowsBackorder) };
  });

  const players = [...product.team.players].sort(
    (a, b) => parseInt(a.number, 10) - parseInt(b.number, 10),
  );

  const availability = availabilityFromVariantInfos(variantsWithStock.map((v) => ({
    stock: v.stock ?? 0,
    allowsBackorder: v.allowsBackorder,
    sizeCode: v.size.code,
    sizePosition: v.size.position,
    versionName: v.version.name,
    versionAdjustment: v.version.priceAdjustment,
    salePrice: v.salePrice,
    compareAtPrice: v.compareAtPrice,
  })));
  const lastValidProductPrice = Math.max(0, ...product.variants.map((v) => v.salePrice).filter((p) => p > 0));
  const priceDisplay = deriveProductDisplayPrice({ availability, currentPrice: lastValidProductPrice, lastValidProductPrice });

  return { ...product, players, variants: variantsWithStock, lastValidProductPrice, ...priceDisplay };
}

export const getProductBySlug = cacheCatalog(loadProductBySlug, "public-product-by-slug-v1");

export async function getRelatedProducts(
  product: Pick<ProductDetailData, "id" | "team">,
  limit = 4,
): Promise<ProductCardData[]> {
  const or: Prisma.ProductWhereInput[] = [{ team: { id: product.team.id } }];
  if (product.team.league) {
    or.push({ team: { leagueId: product.team.league.id } });
  }

  const candidates = await prisma.product.findMany({
    where: { isActive: true, productKind: { not: "MYSTERY_BOX" }, id: { not: product.id }, OR: or },
    select: productCardSelect,
    orderBy: { createdAt: "desc" },
  });

  const mapped = await mapProductCards(candidates);
  return mapped
    .map((card, index) => ({ card, index }))
    .sort((a, b) => {
      const soldOutA = a.card.availability === "OUT_OF_STOCK" ? 1 : 0;
      const soldOutB = b.card.availability === "OUT_OF_STOCK" ? 1 : 0;
      const otherTeamA = a.card.team.id === product.team.id ? 0 : 1;
      const otherTeamB = b.card.team.id === product.team.id ? 0 : 1;
      return soldOutA - soldOutB || otherTeamA - otherTeamB || a.index - b.index;
    })
    .slice(0, limit)
    .map(({ card }) => card);
}

async function loadFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    select: productCardSelect,
    orderBy: { createdAt: "desc" },
  });

  const mapped = await mapProductCards(products);
  return sortPurchasableFirst(mapped, (card) => card.availability === "OUT_OF_STOCK").slice(0, limit);
}

export const getFeaturedProducts = cacheCatalog(loadFeaturedProducts, "public-featured-products-v1");

export async function computeStock(variantId: string): Promise<number> {
  const result = await prisma.inventoryMovement.aggregate({
    where: { variantId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export function computeAvailability(
  stock: number | null,
  allowsBackorder = false,
): "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK" {
  if (stock === null) return "ON_DEMAND";
  if (stock > 0) return "AVAILABLE";
  if (allowsBackorder) return "ON_DEMAND";
  return "OUT_OF_STOCK";
}

async function loadLeagues(): Promise<LeagueData[]> {
  const leagues = await prisma.league.findMany({
    where: { slug: { not: "interno" } },
    select: { id: true, slug: true, name: true, country: true },
    orderBy: { name: "asc" },
  });
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      productKind: { not: "MYSTERY_BOX" },
      team: { league: { slug: { not: "interno" } } },
    },
    select: { id: true, team: { select: { leagueId: true } } },
  });
  const infos = await getVariantInfosByProductIds(products.map((product) => product.id));
  const byLeague = new Map<string, { total: number; soldOut: number }>();
  for (const product of products) {
    const leagueId = product.team.leagueId;
    const bucket = byLeague.get(leagueId) ?? { total: 0, soldOut: 0 };
    bucket.total += 1;
    if (availabilityFromVariantInfos(infos.get(product.id) ?? []) === "OUT_OF_STOCK") {
      bucket.soldOut += 1;
    }
    byLeague.set(leagueId, bucket);
  }

  return leagues.map((league) => {
    const bucket = byLeague.get(league.id) ?? { total: 0, soldOut: 0 };
    return {
      id: league.id,
      slug: league.slug,
      name: league.name,
      country: league.country,
      productCount: bucket.total,
      purchasableCount: bucket.total - bucket.soldOut,
      soldOutCount: bucket.soldOut,
    };
  });
}

export const getLeagues = cacheCatalog(loadLeagues, "public-leagues-v2");

async function loadTeamsByLeague(leagueSlug?: string): Promise<TeamData[]> {
  const where: Prisma.TeamWhereInput = {};
  if (leagueSlug) {
    const leagueSlugs = leagueSlug.split(",").filter(Boolean);
    where.league = leagueSlugs.length > 1 ? { slug: { in: leagueSlugs } } : { slug: leagueSlugs[0] };
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

export const getTeamsByLeague = cacheCatalog(loadTeamsByLeague, "public-teams-by-league-v1");

async function loadLeagueBySlug(slug: string) {
  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      _count: { select: { teams: true } },
      teams: {
        include: {
          _count: { select: { products: { where: { isActive: true } } } },
        },
      },
    },
  });
  if (!league) return null;
  const counts = await countCatalogProducts({ team: { leagueId: league.id } });
  if (counts.total === 0) return null;
  return {
    ...league,
    activeProducts: counts.total,
    purchasableCount: counts.purchasable,
    soldOutCount: counts.soldOut,
  };
}

export const getLeagueBySlug = cacheCatalog(loadLeagueBySlug, "public-league-by-slug-v2");

async function loadTeamBySlug(slug: string) {
  const team = await prisma.team.findUnique({
    where: { slug },
    include: { league: true },
  });
  if (!team) return null;
  const counts = await countCatalogProducts({ teamId: team.id });
  if (counts.total === 0) return null;
  return {
    ...team,
    activeProducts: counts.total,
    purchasableCount: counts.purchasable,
    soldOutCount: counts.soldOut,
  };
}

export const getTeamBySlug = cacheCatalog(loadTeamBySlug, "public-team-by-slug-v2");

export async function getProductsByLeague(leagueId: string, limit = 50) {
  return prisma.product.findMany({
    where: { isActive: true, productKind: { not: "MYSTERY_BOX" }, team: { leagueId } },
    include: { team: true, season: true, images: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getProductsByTeam(teamId: string, limit = 50) {
  return prisma.product.findMany({
    where: { isActive: true, productKind: { not: "MYSTERY_BOX" }, teamId },
    include: { team: true, season: true, images: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function loadSeasons() {
  return prisma.season.findMany({
    where: { slug: { not: "interno-caja-misteriosa" } },
    orderBy: { year: "desc" },
  });
}

async function loadVersions() {
  return prisma.version.findMany({ orderBy: { priceAdjustment: "asc" } });
}

async function loadSizes() {
  return prisma.size.findMany({ orderBy: { position: "asc" } });
}

export const getSeasons = cacheCatalog(loadSeasons, "public-seasons-v1");
export const getVersions = cacheCatalog(loadVersions, "public-versions-v1");
export const getSizes = cacheCatalog(loadSizes, "public-sizes-v1");

/** Misma regla que las fichas: hay stock en alguna talla, o alguna admite bajo pedido. */
async function countCatalogProducts(where: Prisma.ProductWhereInput) {
  const products = await prisma.product.findMany({
    where: { isActive: true, productKind: { not: "MYSTERY_BOX" }, ...where },
    select: { id: true },
  });
  const infos = await getVariantInfosByProductIds(products.map((product) => product.id));
  let soldOut = 0;
  for (const product of products) {
    if (availabilityFromVariantInfos(infos.get(product.id) ?? []) === "OUT_OF_STOCK") soldOut += 1;
  }
  return { total: products.length, purchasable: products.length - soldOut, soldOut };
}

export async function getActiveProductCardsByIds(ids: string[]): Promise<ProductCardData[]> {
  const unique = [...new Set(ids.filter((id) => id.length > 0 && id.length <= 80))].slice(0, 12);
  if (unique.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: unique }, isActive: true },
    select: productCardSelect,
  });
  return mapProductCards(products);
}

export async function getPrimaryImageUrlBySlug(slug: string): Promise<string | null> {
  const clean = slug.trim();
  if (!clean || clean.length > 200) return null;
  const product = await prisma.product.findFirst({
    where: { slug: clean, isActive: true },
    select: {
      images: {
        where: { url: { not: "" } },
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
  });
  return product?.images[0]?.url ?? null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
    variantInfosByProductId?: Map<string, VariantInfo[]>;
  },
): Promise<ProductCardData[]> {
  const ids = products.map((p) => p.id);
  const [rangesByProductId, variantInfosByProductId] = await Promise.all([
    known?.rangesByProductId ??
      (ids.length > 0
        ? getPriceRangesByProductIds(ids)
        : Promise.resolve(new Map<string, { min: number; max: number }>())),
    known?.variantInfosByProductId ??
      (ids.length > 0
        ? getVariantInfosByProductIds(ids)
        : Promise.resolve(new Map<string, VariantInfo[]>())),
  ]);

  return products.map((p) => {
    const range = rangesByProductId.get(p.id) ?? { min: 0, max: 0 };
    const infos = (variantInfosByProductId.get(p.id) ?? []).sort(
      (a, b) => a.sizePosition - b.sizePosition,
    );
    const availableSizes = [
      ...new Set(infos.filter((i) => i.stock > 0 || i.allowsBackorder).map((i) => i.sizeCode)),
    ];
    const versionNames = [
      ...new Set(
        [...infos]
          .sort((a, b) => a.versionAdjustment - b.versionAdjustment)
          .map((i) => i.versionName),
      ),
    ];
    const availability = availabilityFromVariantInfos(infos);
    const lastValidProductPrice = range.max > 0 ? range.max : null;
    const priceDisplay = deriveProductDisplayPrice({
      availability,
      currentPrice: range.min > 0 ? range.min : null,
      lastValidProductPrice,
    });
    const offer = priceDisplay.displayPrice
      ? listingCompareAtPrice({
          salePrice: priceDisplay.displayPrice,
          compareAtPrices: infos
            .filter((info) => info.salePrice === priceDisplay.displayPrice)
            .map((info) => info.compareAtPrice),
        })
      : null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortName: p.shortName,
      kitType: p.kitType,
      brand: p.brand,
      isFeatured: p.isFeatured,
      productKind: p.productKind,
      team: p.team,
      season: p.season,
      primaryImage: p.images[0] ?? null,
      minPrice: range.min,
      maxPrice: range.max,
      availableSizes,
      versionNames,
      canBackorder: infos.some((info) => info.allowsBackorder),
      lastValidProductPrice,
      ...priceDisplay,
      compareAtPrice: offer?.compareAtPrice ?? null,
    } satisfies ProductCardData;
  });
}

function availabilityFromVariantInfos(infos: VariantInfo[]): Availability {
  if (infos.some((info) => info.stock > 0)) return "AVAILABLE";
  if (infos.some((info) => info.allowsBackorder)) return "ON_DEMAND";
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

/** Stock físico (suma del ledger) por variante. Ids ausentes → 0. */
export async function getImmediateStockByVariantIds(
  variantIds: string[],
): Promise<{ variantId: string; stock: number }[]> {
  const unique = [...new Set(variantIds)];
  const stockById = await getStockByVariantIds(unique);
  return unique.map((variantId) => ({ variantId, stock: stockById.get(variantId) ?? 0 }));
}

type VariantInfo = {
  stock: number;
  sizeCode: string;
  sizePosition: number;
  versionName: string;
  versionAdjustment: number;
  allowsBackorder: boolean;
  salePrice: number;
  compareAtPrice: number | null;
};

async function getVariantInfosByProductIds(productIds: string[]): Promise<Map<string, VariantInfo[]>> {
  if (productIds.length === 0) return new Map();
  const variants = await prisma.productVariant.findMany({
    where: { productId: { in: productIds } },
    select: {
      id: true,
      productId: true,
      allowsBackorder: true,
      size: { select: { code: true, position: true } },
      salePrice: true,
      compareAtPrice: true,
      version: { select: { name: true, priceAdjustment: true } },
    },
  });
  const stockByVariantId = await getStockByVariantIds(variants.map((v) => v.id));
  const byProduct = new Map<string, VariantInfo[]>();
  for (const v of variants) {
    const info: VariantInfo = {
      stock: stockByVariantId.get(v.id) ?? 0,
      sizeCode: v.size.code,
      sizePosition: v.size.position,
      versionName: v.version.name,
      versionAdjustment: v.version.priceAdjustment,
      allowsBackorder: v.allowsBackorder,
      salePrice: v.salePrice,
      compareAtPrice: v.compareAtPrice,
    };
    const list = byProduct.get(v.productId) ?? [];
    list.push(info);
    byProduct.set(v.productId, list);
  }
  return byProduct;
}

export type MysteryBoxVariantView = {
  id: string;
  versionSlug: string;
  level: string;
  quality: string;
  sizeCode: string;
  sizeName: string;
  salePrice: number;
  stock: number;
  allowsBackorder: boolean;
  availability: Availability;
};

export type MysteryBoxPageData = {
  name: string;
  description: string;
  imageUrl: string | null;
  variants: MysteryBoxVariantView[];
};

export async function isMysteryBoxInNav(): Promise<boolean> {
  const product = await prisma.product.findFirst({
    where: { slug: MYSTERY_BOX_SLUG, isActive: true, productKind: "MYSTERY_BOX" },
    select: { variants: { select: { id: true, allowsBackorder: true } } },
  });
  if (!product || product.variants.length === 0) return false;
  const stock = await getStockByVariantIds(product.variants.map((variant) => variant.id));
  return product.variants.some(
    (variant) => (stock.get(variant.id) ?? 0) > 0 || variant.allowsBackorder,
  );
}

async function loadMysteryBoxPage(): Promise<MysteryBoxPageData | null> {
  const product = await prisma.product.findFirst({
    where: { slug: MYSTERY_BOX_SLUG, isActive: true, productKind: "MYSTERY_BOX" },
    include: {
      images: { orderBy: { order: "asc" } },
      variants: {
        include: { version: true, size: true },
        orderBy: [{ version: { priceAdjustment: "asc" } }, { size: { position: "asc" } }],
      },
    },
  });
  if (!product) return null;
  const stock = await getStockByVariantIds(product.variants.map((variant) => variant.id));
  const variants = product.variants.flatMap((variant) => {
    const tier = mysteryBoxTier(variant.version.slug);
    if (!tier) return [];
    const onHand = stock.get(variant.id) ?? 0;
    return [
      {
        id: variant.id,
        versionSlug: tier.slug,
        level: tier.level,
        quality: tier.quality,
        sizeCode: variant.size.code,
        sizeName: variant.size.name,
        salePrice: variant.salePrice,
        stock: onHand,
        allowsBackorder: variant.allowsBackorder,
        availability: computeAvailability(onHand, variant.allowsBackorder),
      },
    ];
  });
  const image = product.images.find((item) => item.isPrimary) ?? product.images[0];
  return {
    name: product.name,
    description:
      product.description ??
      "Elige Básica, Estándar o Premium y tu talla. Dentro llega una camiseta de esa calidad. El equipo es sorpresa.",
    imageUrl: image?.url ?? null,
    variants,
  };
}

export const getMysteryBoxPage = cacheCatalog(loadMysteryBoxPage, "public-mystery-box-v1");