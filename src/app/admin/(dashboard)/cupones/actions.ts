"use server";
import {
  createCouponAction,
  updateCouponAction,
  listCouponsAction,
  toggleCouponAction,
} from "@/features/coupons/server/coupon-actions";

export async function createCoupon(input: unknown) {
  return createCouponAction(input);
}

export async function updateCoupon(id: string, input: unknown) {
  return updateCouponAction(id, input);
}

export async function listCoupons() {
  return listCouponsAction();
}

export async function toggleCoupon(id: string, isActive: boolean) {
  return toggleCouponAction(id, isActive);
}
