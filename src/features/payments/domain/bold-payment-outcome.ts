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

export type ResolveReturnAction = "APPLY_APPROVED" | "APPLY_REJECTED" | "NOOP";

export type ReturnHint = Extract<BoldPaymentOutcome, "APPROVED" | "REJECTED" | "PENDING"> | null;

/**
 * Decide whether to persist PAID/FAILED after Bold API lookup + optional return hint.
 * API REJECTED always wins. APPROVED hint can persist PAID when API is inconclusive.
 * Never persist FAILED from return hint alone.
 *
 * @see specs/017-bold-retorno-aprobado/contracts/bold-payment-reconcile.md
 */
export function resolveReturnPersistence(
  apiOutcome: BoldPaymentOutcome,
  returnHint: ReturnHint,
): ResolveReturnAction {
  if (apiOutcome === "APPROVED") return "APPLY_APPROVED";
  if (apiOutcome === "REJECTED") return "APPLY_REJECTED";
  // PENDING / UNAVAILABLE
  if (returnHint === "APPROVED") return "APPLY_APPROVED";
  return "NOOP";
}

/**
 * Parse raw `bold-tx-status` query into a return hint.
 * Absent/empty param → null (do not invent PENDING from missing param).
 */
export function parseReturnTxHint(raw: string | null | undefined): ReturnHint {
  if (raw == null) return null;
  if (!raw.trim()) return null;
  const outcome = normalizeBoldOutcome(raw);
  if (outcome === "UNAVAILABLE") return null;
  return outcome;
}
