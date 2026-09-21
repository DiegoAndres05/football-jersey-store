import { z } from "zod";

export const couponCodeSchema = z.string().trim().toUpperCase().min(2).max(32).regex(/^[A-Z0-9_-]+$/);
export const couponLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  customizationType: z.enum(["NONE", "CUSTOM", "OFFICIAL_PLAYER"]).optional(),
});
export const publicCouponSchema = z.object({
  code: couponCodeSchema,
  lines: z.array(couponLineSchema).min(1),
  saleCurrency: z.enum(["COP", "USD"]).optional(),
});
export const couponInputSchema = z.object({
  code: couponCodeSchema,
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().int().positive(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
}).superRefine((v, ctx) => {
  if (v.discountType === "PERCENTAGE" && v.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "Entre 1 y 100." });
  if (v.endsAt && v.endsAt <= v.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Debe ser posterior al inicio." });
});
export type CouponInput = z.infer<typeof couponInputSchema>;
