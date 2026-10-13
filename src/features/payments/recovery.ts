import type { CartItem } from "@/shared/stores/cart-store";

/**
 * Client-safe payment recovery helpers. No provider credentials or payment
 * status are persisted in the browser.
 */
export function createPaymentIdempotencyKey(seed = "checkout"): string {
  const cryptoApi = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : null;
  const random = cryptoApi?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `bold:${seed}:${random}`;
}

export function shouldKeepCartAfterPaymentError(status: string): boolean {
  return ["ERROR", "PENDING", "UNKNOWN", "CANCELLED", "REJECTED"].includes(status.toUpperCase());
}

const RECOVERY_KEY = "flashsport:payment-recovery";
export function rememberPaymentRecovery(orderCode: string, items: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RECOVERY_KEY, JSON.stringify({ orderCode, items, savedAt: Date.now() }));
  } catch {
    // Storage can be disabled; the order code remains recoverable server-side.
  }
}

export function forgetPaymentRecovery(): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(RECOVERY_KEY); } catch { /* best effort */ }
}

function isRecoveredCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.lineId === "string"
    && item.lineId.length > 0
    && typeof item.variantId === "string"
    && typeof item.productName === "string"
    && typeof item.quantity === "number"
    && item.quantity > 0
    && typeof item.unitPrice === "number";
}

export function recoveredCartItems(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { items?: unknown };
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items.filter(isRecoveredCartItem);
  } catch {
    return [];
  }
}

export function readRecoveredCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return recoveredCartItems(window.sessionStorage.getItem(RECOVERY_KEY));
  } catch {
    return [];
  }
}
