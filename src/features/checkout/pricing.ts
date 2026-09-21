import { shippingFee } from "@/shared/config/site";

export type PricingLine = {
  quantity: number;
  baseUnitPriceCop: number;
  personalizationSurchargeCop?: number;
};

export type PricingSummary = {
  subtotal: number;
  personalizationFee: number;
  discount: number;
  shipping: number;
  total: number;
  currency: "COP";
  shippingScope: "NATIONAL" | "INTERNATIONAL_QUOTE_PENDING";
  chargeable: boolean;
};

export function calculatePricing(lines: readonly PricingLine[], options: { country?: string; discount?: number } = {}): PricingSummary {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.baseUnitPriceCop, 0);
  const personalizationFee = lines.reduce((sum, line) => sum + line.quantity * (line.personalizationSurchargeCop ?? 0), 0);
  const discount = Math.max(0, Math.min(options.discount ?? 0, subtotal + personalizationFee));
  const isColombia = (options.country ?? "CO").trim().toUpperCase() === "CO";
  const shipping = isColombia ? shippingFee(subtotal + personalizationFee) : 0;
  const total = Math.max(0, subtotal + personalizationFee - discount + shipping);
  return { subtotal, personalizationFee, discount, shipping, total, currency: "COP", shippingScope: isColombia ? "NATIONAL" : "INTERNATIONAL_QUOTE_PENDING", chargeable: isColombia };
}
