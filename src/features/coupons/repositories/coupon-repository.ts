import { prisma } from "@/lib/prisma";
import { Prisma, type Coupon, type DiscountType } from "@prisma/client";
import { calculateCouponTotals } from "../domain/discount";
import { couponExpiry, normalizeCouponCode } from "../services/coupon-validation";
import type { CouponInput } from "../schemas/coupon-schema";

export async function findCoupon(code: string) {
  return prisma.coupon.findUnique({ where: { code: normalizeCouponCode(code) }, include: { usages: true } });
}

export async function releaseExpiredUsages(couponId: string, now = new Date(), db: Prisma.TransactionClient | typeof prisma = prisma) {
  return db.couponUsage.updateMany({
    where: { couponId, state: "RESERVED", expiresAt: { lte: now } },
    data: { state: "RELEASED", releasedAt: now, releaseReason: "Expiración automática" },
  });
}

export function availableCouponUses(coupon: { maxUses: number | null; usages: Array<{ state: string; expiresAt: Date }> }, now = new Date()) {
  if (coupon.maxUses == null) return true;
  const used = coupon.usages.filter((u) => u.state === "CONFIRMED" || (u.state === "RESERVED" && u.expiresAt > now)).length;
  return used < coupon.maxUses;
}

export async function reserveCoupon(tx: Prisma.TransactionClient, couponId: string, orderId: string, now = new Date()) {
  // Serialize the last available use at the database boundary.
  await tx.$queryRaw`SELECT "id" FROM "Coupon" WHERE "id" = ${couponId} FOR UPDATE`;
  const coupon = await tx.coupon.findUnique({ where: { id: couponId }, include: { usages: true } });
  if (!coupon) return null;
  await releaseExpiredUsages(couponId, now, tx);
  const refreshed = await tx.coupon.findUnique({ where: { id: couponId }, include: { usages: true } });
  if (!refreshed || !availableCouponUses(refreshed, now)) return null;
  return tx.couponUsage.create({ data: { couponId, orderId, expiresAt: couponExpiry(now) } });
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  return prisma.coupon.create({ data: { ...input, code: normalizeCouponCode(input.code), endsAt: input.endsAt ?? null, maxUses: input.maxUses ?? null } });
}
export async function updateCoupon(id: string, input: CouponInput): Promise<Coupon> {
  return prisma.coupon.update({ where: { id }, data: { ...input, code: normalizeCouponCode(input.code), endsAt: input.endsAt ?? null, maxUses: input.maxUses ?? null } });
}
export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { usages: { select: { state: true } } } });
}
export async function toggleCoupon(id: string, isActive: boolean) {
  return prisma.coupon.update({ where: { id }, data: { isActive } });
}

export function couponTotals(base: number, shipping: number, type: DiscountType, value: number) {
  return calculateCouponTotals(base, shipping, type, value);
}
