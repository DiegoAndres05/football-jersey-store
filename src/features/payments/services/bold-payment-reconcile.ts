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
  /** Raw `bold-tx-status` from confirmation URL */
  returnTxStatus?: string | null;
};

export type ReconcileBoldOrderResult = {
  outcome: BoldPaymentOutcome;
  apply?: ApplyBoldPaymentResult;
};

/**
 * Reconcile a Bold order by querying the Bold transaction API, with optional
 * return-URL fallback when the API is inconclusive and the hint is approved.
 *
 * @see specs/017-bold-retorno-aprobado/contracts/bold-payment-reconcile.md
 */
export async function reconcileBoldOrder(
  input: ReconcileBoldOrderInput,
): Promise<ReconcileBoldOrderResult> {
  const { orderCode, boldOrderId, returnTxStatus } = input;

  let txStatus = await getBoldTransactionStatus(orderCode);
  let rawStatus = txStatus?.status ?? null;

  if ((!rawStatus || normalizeBoldOutcome(rawStatus) === "PENDING") && boldOrderId) {
    const secondary = await getBoldTransactionStatus(boldOrderId);
    if (secondary?.status) {
      txStatus = secondary;
      rawStatus = secondary.status;
    }
  }

  // Null / missing API → treat as UNAVAILABLE for decision table (same as PENDING for fallback)
  const apiOutcome: BoldPaymentOutcome = rawStatus
    ? normalizeBoldOutcome(rawStatus)
    : "UNAVAILABLE";

  const returnHint = parseReturnTxHint(returnTxStatus);
  const action = resolveReturnPersistence(apiOutcome, returnHint);

  if (action === "NOOP") {
    return { outcome: apiOutcome === "UNAVAILABLE" ? "PENDING" : apiOutcome };
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

  return { outcome, apply };
}
