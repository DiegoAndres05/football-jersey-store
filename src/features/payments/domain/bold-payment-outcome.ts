/**
 * Normalizes raw Bold transaction status strings into a domain outcome
 * that the rest of the system can act on idempotently.
 *
 * @see specs/015-bold-confirmacion-pago/data-model.md
 */

export type BoldPaymentOutcome = "APPROVED" | "REJECTED" | "PENDING" | "UNAVAILABLE";

/**
 * Map a raw status string from Bold (API response or webhook event type)
 * to a normalized domain outcome.
 *
 * Case-insensitive. Handles common Bold variants:
 * - "approved", "APPROVED", "SaleApproved" → APPROVED
 * - "rejected", "REJECTED", "failed", "FAILED", "SaleRejected" → REJECTED
 * - "pending", "PENDING", "NO_TRANSACTION_FOUND", "" → PENDING
 * - null / undefined / unexpected → PENDING
 */
export function normalizeBoldOutcome(raw: string | null | undefined): BoldPaymentOutcome {
  if (raw == null) return "PENDING";

  const normalized = raw.trim().toLowerCase();

  if (!normalized) return "PENDING";

  // Approved variants
  if (
    normalized === "approved" ||
    normalized === "sale_approved" ||
    normalized === "saleapproved"
  ) {
    return "APPROVED";
  }

  // Rejected / failed variants
  if (
    normalized === "rejected" ||
    normalized === "sale_rejected" ||
    normalized === "salerejected" ||
    normalized === "failed" ||
    normalized === "declined"
  ) {
    return "REJECTED";
  }

  // Pending / not found / no transaction
  if (
    normalized === "pending" ||
    normalized === "no_transaction_found" ||
    normalized === "notfound" ||
    normalized === "initiated"
  ) {
    return "PENDING";
  }

  // Unknown → treat as pending (safe default; do not fabricate approved/rejected)
  return "PENDING";
}

/**
 * Map a Bold webhook event type to a domain outcome.
 * Webhook types: "SALE_APPROVED", "SALE_REJECTED".
 */
export function normalizeWebhookEventType(eventType: string | null | undefined): BoldPaymentOutcome | null {
  if (!eventType) return null;
  const t = eventType.trim().toUpperCase();
  if (t === "SALE_APPROVED") return "APPROVED";
  if (t === "SALE_REJECTED") return "REJECTED";
  return null;
}
