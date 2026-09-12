import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { SITE } from "@/shared/config/site";

type ProductForJsonLd = {
  slug: string;
  name: string;
  description?: string | null;
  brand?: string | null;
  kitType?: string;
  imageUrl?: string | null;
  teamName?: string;
  seasonName?: string;
  variants: {
    sku: string | null;
    salePrice: number;
    stock: "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK";
  }[];
};

const AVAILABILITY_MAP: Record<string, string> = {
  AVAILABLE: "https://schema.org/InStock",
  ON_DEMAND: "https://schema.org/PreOrder",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
};

export function buildProductJsonLd(product: ProductForJsonLd): Record<string, unknown> | null {
  if (!product) return null;

  const origin = resolvePublicOrigin();
  const productUrl = `${origin}/productos/${product.slug}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? `${product.name}${product.teamName ? ` - ${product.teamName}` : ""}${product.seasonName ? ` · ${product.seasonName}` : ""}`,
    url: productUrl,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.kitType,
  };

  if (product.variants && product.variants.length > 0) {
    jsonLd.offers = product.variants.map((variant) => ({
      "@type": "Offer",
      priceCurrency: "COP",
      price: Math.round(variant.salePrice),
      availability: AVAILABILITY_MAP[variant.stock] ?? "https://schema.org/OutOfStock",
      url: productUrl,
      sku: variant.sku ?? undefined,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE.name,
      },
    }));
  }

  return jsonLd;
}
