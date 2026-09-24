import { shippingFee } from "@/shared/config/site";

export type OrderBreakdownInput = {
  productSubtotal: number;
  personalizationFee?: number;
  discount?: number;
  country?: string;
};

export type OrderBreakdown = {
  productSubtotal: number;
  personalizationFee: number;
  discount: number;
  shipping: number;
  total: number;
  shippingScope: "NATIONAL" | "INTERNATIONAL";
};

export function calculateOrderBreakdown({
  productSubtotal,
  personalizationFee = 0,
  discount = 0,
  country = "Colombia",
}: OrderBreakdownInput): OrderBreakdown {
  const subtotal = Math.max(0, Math.round(productSubtotal));
  const customization = Math.max(0, Math.round(personalizationFee));
  const couponDiscount = Math.max(0, Math.round(discount));
  const isColombia = String(country).trim().toLocaleLowerCase("es-CO") === "colombia" || String(country).trim().toUpperCase() === "CO";
  const shipping = isColombia ? shippingFee(subtotal + customization) : 0;
  const total = Math.max(0, subtotal + customization + shipping - couponDiscount);

  return {
    productSubtotal: subtotal,
    personalizationFee: customization,
    discount: couponDiscount,
    shipping,
    total,
    shippingScope: isColombia ? "NATIONAL" : "INTERNATIONAL",
  };
}
