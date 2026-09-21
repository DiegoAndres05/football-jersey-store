import type { DiscountType, CouponUsageState } from "@prisma/client";

export type CouponLine = {
  variantId: string;
  quantity: number;
  customizationType?: "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";
};

export type CouponValidationSuccess = {
  ok: true;
  code: string;
  discountType: DiscountType;
  discountAmount: number;
  eligibleBase: number;
  shippingFee: number;
  total: number;
  message: string;
};

export type CouponValidationFailure = {
  ok: false;
  reason:
    | "INVALID_FORMAT" | "NOT_FOUND" | "INACTIVE" | "NOT_STARTED" | "EXPIRED"
    | "EXHAUSTED" | "NOT_APPLICABLE" | "INVALID_CART" | "TEMPORARILY_UNAVAILABLE";
  message: string;
};

export type CouponValidationResult = CouponValidationSuccess | CouponValidationFailure;
export type CouponActionResult<T> = { ok: true; coupon: T } | { ok: false; reason: string; message: string };
export { DiscountType, CouponUsageState };

export function safeCouponError(reason: CouponValidationFailure["reason"]): CouponValidationFailure {
  const messages: Record<CouponValidationFailure["reason"], string> = {
    INVALID_FORMAT: "Escribe un código de cupón válido.",
    NOT_FOUND: "El código no es válido.",
    INACTIVE: "Este cupón no está disponible.",
    NOT_STARTED: "Este cupón aún no está vigente.",
    EXPIRED: "Este cupón ya expiró.",
    EXHAUSTED: "Este cupón ya no tiene usos disponibles.",
    NOT_APPLICABLE: "El cupón no aplica a este carrito.",
    INVALID_CART: "No pudimos validar el carrito. Revisa tus productos.",
    TEMPORARILY_UNAVAILABLE: "No pudimos validar el cupón. Intenta de nuevo.",
  };
  return { ok: false, reason, message: messages[reason] };
}
