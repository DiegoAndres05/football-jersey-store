import type { Product, ProductImage, ProductVariant, Team, Season, Version, Size, League } from "@prisma/client";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  kitType: string;
  brand: string | null;
  isFeatured: boolean;
  team: Pick<Team, "id" | "slug" | "name" | "shortName"> & {
    league: Pick<League, "id" | "slug" | "name"> | null;
  };
  season: Pick<Season, "id" | "slug" | "name" | "isRetro">;
  primaryImage: Pick<ProductImage, "id" | "url" | "altText"> | null;
  minPrice: number;
  maxPrice: number;
  availability: Availability;
  availableSizes: string[];
  versionNames: string[];
};

export type Availability = "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK";

export type ProductFilters = {
  league?: string;
  team?: string;
  season?: string;
  version?: string;
  size?: string;
  availability?: Availability;
  search?: string;
  sort?: SortOption;
  page?: number;
};

export type SortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest";

export type ProductListResult = {
  products: ProductCardData[];
  total: number;
  page: number;
  totalPages: number;
};

export type VariantWithRelations = ProductVariant & {
  version: Version;
  size: Size;
};

export type ProductDetailData = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  description: string | null;
  kitType: string;
  brand: string | null;
  isFeatured: boolean;
  isActive: boolean;
  customizationsEnabled: boolean;
  customizationSurcharge: number;
  hasPlayerPrint: boolean;
  team: Pick<Team, "id" | "slug" | "name" | "shortName" | "crestUrl"> & {
    league: Pick<League, "id" | "slug" | "name" | "country"> | null;
  };
  season: Pick<Season, "id" | "slug" | "name" | "isRetro">;
  players: PlayerData[];
  images: (Pick<ProductImage, "id" | "url" | "altText" | "order" | "isPrimary">)[];
  variants: VariantWithStock[];
};

export type PlayerData = {
  id: string;
  name: string;
  number: string;
};

export type VariantWithStock = VariantWithRelations & {
  stock: number | null;
  availability: Availability;
};

export type LeagueData = Pick<League, "id" | "slug" | "name" | "country"> & {
  productCount: number;
};

export type TeamData = Pick<Team, "id" | "slug" | "name" | "shortName"> & {
  league: Pick<League, "id" | "slug" | "name"> | null;
};
