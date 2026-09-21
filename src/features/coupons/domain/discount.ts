import type { DiscountType } from "@prisma/client";

export function calculateDiscount(base: number, type: DiscountType | "PERCENTAGE" | "FIXED", value: number): number {
  if (!Number.isInteger(base) || base <= 0) return 0;
  const raw = type === "PERCENTAGE" ? Math.floor((base * value + 50) / 100) : value;
  return Math.min(base, Math.max(0, Math.trunc(raw)));
}

export function calculateCouponTotals(eligibleBase: number, shippingFee: number, type: DiscountType | "PERCENTAGE" | "FIXED", value: number) {
  const discountAmount = calculateDiscount(eligibleBase, type, value);
  return { eligibleBase, discountAmount, shippingFee, total: Math.max(0, eligibleBase + shippingFee - discountAmount) };
}
