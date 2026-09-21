import type { PricingSummary } from "./pricing";

export type CheckoutSummary = PricingSummary & { subtotalWithPersonalization: number };

export function buildCheckoutSummary(pricing: PricingSummary): CheckoutSummary {
  return { ...pricing, subtotalWithPersonalization: pricing.subtotal + pricing.personalizationFee };
}
