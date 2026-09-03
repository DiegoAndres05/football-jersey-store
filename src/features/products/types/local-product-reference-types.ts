export type LocalProductReference = {
  productId: string;
  slug: string;
};

export type FavoriteReference = LocalProductReference & { savedAt: number };
export type RecentlyViewedReference = LocalProductReference & { lastViewedAt: number };
export type HydrationStatus = "idle" | "loading" | "hydrated" | "degraded";

export type ResolvedLocalProduct = LocalProductReference & {
  name: string;
  imageUrl: string | null;
  imageAlt: string;
  minPrice: number | null;
  availability: "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK" | "NOT_FOUND";
};