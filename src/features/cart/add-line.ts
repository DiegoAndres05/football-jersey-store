import type { DeliveryMode } from "@/features/products/types/delivery-mode";

export type AddLineInput = {
  stock: number;
  allowsBackorder: boolean;
  deliveryMode: DeliveryMode;
};

export type AddLineResult =
  | { ok: true }
  | { ok: false; code: "OUT_OF_STOCK" | "IMMEDIATE_STOCK_EXHAUSTED" };

/**
 * Shared guard for public add-to-cart entry points. The client may display a
 * stale state, so callers should repeat this check server-side before ordering.
 */
export function canAddLine(input: AddLineInput): AddLineResult {
  if (input.deliveryMode === "INMEDIATA") {
    return input.stock > 0 ? { ok: true } : { ok: false, code: "IMMEDIATE_STOCK_EXHAUSTED" };
  }
  return input.allowsBackorder
    ? { ok: true }
    : { ok: false, code: "OUT_OF_STOCK" };
}

