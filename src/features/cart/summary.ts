import { calculatePricing, type PricingLine, type PricingSummary } from "@/features/checkout/pricing";

export type CartSummaryInput = PricingLine & { lineId?: string };
export function summarizeCart(lines: readonly CartSummaryInput[], options: { country?: string; discount?: number } = {}): PricingSummary {
  return calculatePricing(lines, options);
}
