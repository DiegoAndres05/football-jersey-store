export const COUPON_RESERVATION_TTL_MS = 30 * 60 * 1000;
export const couponExpiry = (now = new Date()) => new Date(now.getTime() + COUPON_RESERVATION_TTL_MS);
export const normalizeCouponCode = (code: string) => code.trim().toUpperCase();
