import type { Availability, ProductCardData, ProductDetailData, VariantWithStock } from "./types/product-types";

export type AvailabilityViewModel = {
  availability: Availability;
  label: "En stock" | "Bajo pedido" | "Agotado";
  eta: string | null;
  canAddToCart: boolean;
};

export type ProductCardViewModel = AvailabilityViewModel & {
  price: number | null;
  showPrice: boolean;
  sizes: string[];
  versions: string[];
  imageUrl: string | null;
};

export type ProductPdpViewModel = AvailabilityViewModel & {
  selectedVariant: VariantWithStock | null;
  price: number | null;
  showPrice: boolean;
};

export function availabilityViewModel(
  availability: Availability,
  stock?: number | null,
): AvailabilityViewModel {
  if (availability === "AVAILABLE") {
    return {
      availability,
      label: "En stock",
      eta: "Despacho en 24–48 horas",
      canAddToCart: (stock ?? 1) > 0,
    };
  }
  if (availability === "ON_DEMAND") {
    return {
      availability,
      label: "Bajo pedido",
      eta: "Entrega estimada: 15–20 días hábiles",
      canAddToCart: true,
    };
  }
  return { availability, label: "Agotado", eta: null, canAddToCart: false };
}

export function buildProductCardViewModel(product: ProductCardData): ProductCardViewModel {
  return {
    ...availabilityViewModel(product.availability),
    price: product.displayPrice,
    showPrice: product.showPrice && product.displayPrice !== null,
    sizes: product.availableSizes,
    versions: product.versionNames,
    imageUrl: product.primaryImage?.url ?? null,
  };
}

export function buildProductPdpViewModel(
  product: Pick<ProductDetailData, "availability" | "displayPrice" | "showPrice" | "variants">,
  variant: VariantWithStock | null,
): ProductPdpViewModel {
  const availability = variant?.availability ?? product.availability;
  const state = availabilityViewModel(availability, variant?.stock);
  return {
    ...state,
    selectedVariant: variant,
    price: variant?.salePrice && variant.salePrice > 0 ? variant.salePrice : product.displayPrice,
    showPrice: product.showPrice || availability !== "OUT_OF_STOCK",
  };
}

