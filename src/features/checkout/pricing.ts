import { shippingFee } from "@/shared/config/site";
import { nationalShippingFee, type ShippingRates } from "@/features/checkout/shipping";

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
  shippingScope: "NATIONAL" | "INTERNATIONAL" | "INTERNATIONAL_QUOTE_PENDING";
  chargeable: boolean;
};

export function calculatePricing(lines: readonly PricingLine[], options: { country?: string; discount?: number; shippingRates?: ShippingRates } = {}): PricingSummary {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.baseUnitPriceCop, 0);
  const personalizationFee = lines.reduce((sum, line) => sum + line.quantity * (line.personalizationSurchargeCop ?? 0), 0);
  const discount = Math.max(0, Math.min(options.discount ?? 0, subtotal + personalizationFee));
  const isColombia = (options.country ?? "CO").trim().toUpperCase() === "CO";
  const merchandise = subtotal + personalizationFee;
  const shipping = isColombia
    ? options.shippingRates
      ? nationalShippingFee(merchandise, options.shippingRates.nationalFeeCop)
      : shippingFee(merchandise)
    : options.shippingRates?.internationalFeeCop ?? 0;
  const total = Math.max(0, subtotal + personalizationFee - discount + shipping);
  const internationalFee = options.shippingRates?.internationalFeeCop ?? 0;
  return {
    subtotal,
    personalizationFee,
    discount,
    shipping,
    total,
    currency: "COP",
    shippingScope: isColombia ? "NATIONAL" : internationalFee > 0 ? "INTERNATIONAL" : "INTERNATIONAL_QUOTE_PENDING",
    chargeable: isColombia,
  };
}
