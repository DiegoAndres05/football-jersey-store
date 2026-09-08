import "server-only";
import { getBoldTransactionStatus } from "@/features/payments/services/bold-service";
import { normalizeBoldOutcome, type BoldPaymentOutcome } from "@/features/payments/domain/bold-payment-outcome";
import { applyBoldPayment, type ApplyBoldPaymentResult } from "@/features/orders/services/apply-bold-payment";

export type ReconcileBoldOrderInput = {
  orderCode: string;
  boldOrderId?: string | null;
};

export type ReconcileBoldOrderResult = {
  outcome: BoldPaymentOutcome;
  apply?: ApplyBoldPaymentResult;
};

/**
 * Reconcile a Bold order by querying the Bold transaction API.
 *
 * 1. Primary lookup by orderCode.
 * 2. If inconclusive and boldOrderId is provided, secondary lookup.
 * 3. Map provider status → domain outcome.
 * 4. On APPROVED/REJECTED, apply the shared payment transition.
 * 5. On PENDING/UNAVAILABLE, do not change order status.
 */
export async function reconcileBoldOrder(
  input: ReconcileBoldOrderInput,
): Promise<ReconcileBoldOrderResult> {
  const { orderCode, boldOrderId } = input;

  // Primary lookup by order code
  let txStatus = await getBoldTransactionStatus(orderCode);
  let rawStatus = txStatus?.status ?? null;

  // Secondary lookup by Bold transaction/order ID if primary was inconclusive
  if (!rawStatus && boldOrderId) {
    txStatus = await getBoldTransactionStatus(boldOrderId);
    rawStatus = txStatus?.status ?? null;
  }

  const outcome = normalizeBoldOutcome(rawStatus);

  // Only apply on definitive outcomes
  if (outcome === "APPROVED" || outcome === "REJECTED") {
    const providerRef = txStatus?.transactionId ?? boldOrderId ?? undefined;
    const apply = await applyBoldPayment({
      orderCode,
      outcome,
      source: "reconcile",
      providerRef,
    });
    return { outcome, apply };
  }

  // PENDING or UNAVAILABLE — no status change
  return { outcome };
}
