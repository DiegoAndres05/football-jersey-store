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
