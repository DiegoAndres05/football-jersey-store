"use server";

import { prisma } from "@/lib/prisma";
import { shippingFee } from "@/shared/config/site";
import { getSessionUser } from "@/features/auth/server/session";
import { publicCouponSchema, couponInputSchema, type CouponInput } from "../schemas/coupon-schema";
import { calculateCouponTotals } from "../domain/discount";
import { findCoupon, availableCouponUses, createCoupon, updateCoupon, listCoupons, toggleCoupon } from "../repositories/coupon-repository";
import { normalizeCouponCode } from "../services/coupon-validation";
import { safeCouponError, type CouponValidationResult } from "../types/coupon-types";

export async function validateCoupon(input: unknown): Promise<CouponValidationResult> {
  const parsed = publicCouponSchema.safeParse(input);
  if (!parsed.success) return safeCouponError("INVALID_FORMAT");
  try {
    const coupon = await findCoupon(parsed.data.code);
    if (!coupon) return safeCouponError("NOT_FOUND");
    const now = new Date();
    if (!coupon.isActive) return safeCouponError("INACTIVE");
    if (now < coupon.startsAt) return safeCouponError("NOT_STARTED");
    if (coupon.endsAt && now > coupon.endsAt) return safeCouponError("EXPIRED");
    if (!availableCouponUses(coupon)) return safeCouponError("EXHAUSTED");
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: parsed.data.lines.map((l) => l.variantId) } },
      include: { product: { select: { customizationsEnabled: true, customizationSurcharge: true } } },
    });
    const byId = new Map(variants.map((v) => [v.id, v]));
    let base = 0;
    for (const line of parsed.data.lines) {
      const variant = byId.get(line.variantId);
      if (!variant) return safeCouponError("INVALID_CART");
      const surcharge = line.customizationType && line.customizationType !== "NONE" && variant.product.customizationsEnabled ? variant.product.customizationSurcharge : 0;
      base += (variant.salePrice + surcharge) * line.quantity;
    }
    if (base <= 0) return safeCouponError("NOT_APPLICABLE");
    const shipping = shippingFee(base);
    const totals = calculateCouponTotals(base, shipping, coupon.discountType, coupon.value);
    return { ok: true, code: normalizeCouponCode(coupon.code), discountType: coupon.discountType, ...totals, message: "Cupón aplicado correctamente." };
  } catch (error) {
    console.error("[validateCoupon]", error);
    return safeCouponError("TEMPORARILY_UNAVAILABLE");
  }
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function createCouponAction(input: unknown) {
  try { await requireAdmin(); const parsed = couponInputSchema.safeParse(input); if (!parsed.success) return { ok: false as const, reason: "INVALID_INPUT", message: "Revisa los datos del cupón." }; return { ok: true as const, coupon: await createCoupon(parsed.data) }; }
  catch (error) { if (error instanceof Error && error.message === "UNAUTHORIZED") return { ok: false as const, reason: "UNAUTHORIZED", message: "No autorizado." }; return { ok: false as const, reason: "TEMPORARILY_UNAVAILABLE", message: "No se pudo guardar el cupón." }; }
}
export async function updateCouponAction(id: string, input: unknown) {
  try { await requireAdmin(); const parsed = couponInputSchema.safeParse(input); if (!parsed.success) return { ok: false as const, reason: "INVALID_INPUT", message: "Revisa los datos del cupón." }; return { ok: true as const, coupon: await updateCoupon(id, parsed.data) }; }
  catch (error) { if (error instanceof Error && error.message === "UNAUTHORIZED") return { ok: false as const, reason: "UNAUTHORIZED", message: "No autorizado." }; return { ok: false as const, reason: "TEMPORARILY_UNAVAILABLE", message: "No se pudo actualizar el cupón." }; }
}
export async function listCouponsAction() {
  try { await requireAdmin(); return { ok: true as const, coupons: await listCoupons() }; } catch { return { ok: false as const, reason: "UNAUTHORIZED", message: "No autorizado." }; }
}
export async function toggleCouponAction(id: string, isActive: boolean) {
  try { await requireAdmin(); return { ok: true as const, coupon: await toggleCoupon(id, isActive) }; } catch { return { ok: false as const, reason: "UNAUTHORIZED", message: "No autorizado." }; }
}
