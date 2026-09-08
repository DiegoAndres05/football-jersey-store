import "server-only";
import { getBoldTransactionStatus } from "@/features/payments/services/bold-service";
import {
  normalizeBoldOutcome,
  parseReturnTxHint,
  resolveReturnPersistence,
  type BoldPaymentOutcome,
} from "@/features/payments/domain/bold-payment-outcome";
import {
  applyBoldPayment,
  type ApplyBoldPaymentResult,
  type BoldPaymentSource,
} from "@/features/orders/services/apply-bold-payment";

export type ReconcileBoldOrderInput = {
  orderCode: string;
  boldOrderId?: string | null;
  /** Expected order total (integer, same currency as Bold — e.g., 95000 for $95.000 COP).
   *  Used to verify the Bold API amount matches what we charged the customer. */
  orderTotal?: number | null;
  /** Expected order currency (e.g., "COP"). Used to verify Bold API currency. */
  orderCurrency?: string | null;
  /** Raw `bold-tx-status` from confirmation URL. Pass only when the caller
   *  trusts the source (e.g., server component reading the return URL).
   *  For untrusted callers (e.g., client API), omit this — the server
   *  queries Bold directly and never accepts client-provided payment status. */
  returnTxStatus?: string | null;
};

export type ReconcileBoldOrderResult = {
  outcome: BoldPaymentOutcome;
  apply?: ApplyBoldPaymentResult;
};

/**
 * Reconcile a Bold order by querying the Bold transaction API.
 * `returnTxStatus` is accepted for compatibility but ignored by
 * `resolveReturnPersistence` (Bold API is the sole payment authority).
 */
export async function reconcileBoldOrder(
  input: ReconcileBoldOrderInput,
): Promise<ReconcileBoldOrderResult> {
  const { orderCode, boldOrderId, returnTxStatus, orderTotal, orderCurrency } = input;

  // ── Primary lookup: order code is the authoritative reference ──
  let txStatus = await getBoldTransactionStatus(orderCode);
  let rawStatus = txStatus?.status ?? null;

  // ── Secondary lookup (boldOrderId as auxiliary hint only) ──
  if ((!rawStatus || normalizeBoldOutcome(rawStatus) === "PENDING") && boldOrderId) {
    const secondary = await getBoldTransactionStatus(boldOrderId);
    if (secondary?.status) {
      // Cross-order protection: only accept secondary lookup if its reference_id matches this order
      const secondaryRef = secondary.referenceId?.trim();
      if (!secondaryRef || secondaryRef !== orderCode) {
        console.warn(
          `[Bold Reconcile] Order ${orderCode}: secondary lookup reference_id="${secondaryRef}" does not match orderCode — rejecting cross-order attempt`,
        );
        // Do NOT use this secondary result — it belongs to a different order
      } else {
        txStatus = secondary;
        rawStatus = secondary.status;
      }
    }
  }

  // Null / missing API → treat as UNAVAILABLE for decision table
  const apiOutcome: BoldPaymentOutcome = rawStatus
    ? normalizeBoldOutcome(rawStatus)
    : "UNAVAILABLE";

  // ── Security gate: Bold API is SOLE authority — returnHint is ignored ──
  const returnHint = parseReturnTxHint(returnTxStatus);
  const action = resolveReturnPersistence(apiOutcome, returnHint);

  console.log(
    `[Bold Reconcile] Order ${orderCode}: apiOutcome=${apiOutcome}, returnHint=${returnHint ?? "none"}, action=${action}`,
  );

  if (action === "NOOP") {
    return { outcome: apiOutcome === "UNAVAILABLE" ? "PENDING" : apiOutcome };
  }

  // ── Integrity validation for APPROVED: amount + currency + reference_id ──
  if (apiOutcome === "APPROVED" && action === "APPLY_APPROVED") {
    const validationErrors: string[] = [];

    // Cross-order protection: Bold reference_id must match our order code
    const boldRefId = txStatus?.referenceId?.trim();
    if (boldRefId && boldRefId !== orderCode) {
      validationErrors.push(
        `reference_id mismatch: Bold="${boldRefId}" vs order="${orderCode}"`,
      );
    }

    // Amount validation: Bold API amount must match order total
    if (orderTotal != null && txStatus?.amount != null) {
      if (txStatus.amount !== orderTotal) {
        validationErrors.push(
          `amount mismatch: Bold=${txStatus.amount} vs order=${orderTotal}`,
        );
      }
    }

    // Currency validation: Bold API currency must match order currency
    if (orderCurrency && txStatus?.currency) {
      const boldCurrency = txStatus.currency.trim().toUpperCase();
      const expectedCurrency = orderCurrency.trim().toUpperCase();
      if (boldCurrency !== expectedCurrency) {
        validationErrors.push(
          `currency mismatch: Bold="${boldCurrency}" vs order="${expectedCurrency}"`,
        );
      }
    }

    if (validationErrors.length > 0) {
      console.error(
        `[Bold Reconcile] Order ${orderCode}: REJECTED — integrity validation failed: ${validationErrors.join("; ")}`,
      );
      // Do NOT apply — treat as PENDING (wait for webhook or manual review)
      return { outcome: "PENDING" };
    }
  }

  const providerRef = txStatus?.transactionId ?? boldOrderId ?? undefined;
  const outcome = action === "APPLY_APPROVED" ? "APPROVED" : "REJECTED";
  const source: BoldPaymentSource =
    action === "APPLY_APPROVED" && apiOutcome !== "APPROVED" ? "return" : "reconcile";

  const apply = await applyBoldPayment({
    orderCode,
    outcome,
    source,
    providerRef,
  });

  console.log(
    `[Bold Reconcile] Order ${orderCode}: applied=${apply.applied}, toStatus=${apply.applied ? apply.toStatus : apply.reason}`,
  );

  return { outcome, apply };
}
