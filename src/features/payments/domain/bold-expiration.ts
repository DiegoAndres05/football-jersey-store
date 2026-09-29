/** Bold keeps a payment-button sale queryable for 24 hours. */
export const BOLD_VOUCHER_LOOKUP_WINDOW_MS = 24 * 60 * 60 * 1000;

export type BoldExpirationDecision = "RECONCILE" | "EXPIRE" | "KEEP";

/**
 * Decide what the reservation-expiration job does with a pending order that
 * already opened Bold, based on the raw `payment_status` of the voucher API.
 * `null` means Bold could not be queried.
 */
export function decideBoldExpiration(rawStatus: string | null, reservationAgeMs: number): BoldExpirationDecision {
  const status = rawStatus?.trim().toUpperCase() ?? null;
  if (status === "APPROVED" || status === "REJECTED" || status === "FAILED") return "RECONCILE";
  if (status === "NO_TRANSACTION_FOUND" || status === "VOIDED") return "EXPIRE";
  return reservationAgeMs >= BOLD_VOUCHER_LOOKUP_WINDOW_MS ? "EXPIRE" : "KEEP";
}
