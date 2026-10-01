import { computeBoldIntegritySignature } from "./bold-integrity";

/** The BoldTransaction Flashsport stored when it signed the payment button. */
export type PreparedBoldTransaction = {
  externalReference: string;
  amount: number;
  currency: string;
  signatureHash: string | null;
};

export type PreparedCurrencyEvidenceInput = {
  orderCode: string;
  orderCurrency: string;
  boldStatus: string | null | undefined;
  boldReference: string | null | undefined;
  boldAmount: number | null | undefined;
  transaction: PreparedBoldTransaction | null;
  secretKey: string | null | undefined;
};

/**
 * Bold's payment-voucher API does not return a currency. The currency can
 * still be verified from the transaction we prepared, because Bold only opens
 * the button when its integrity hash (order-id + amount + currency + secret)
 * matches. Returns the reasons that evidence is not usable; empty = verified.
 */
export function preparedTransactionCurrencyProblems(input: PreparedCurrencyEvidenceInput): string[] {
  const tx = input.transaction;
  if (!tx) return ["no prepared BoldTransaction"];

  const problems: string[] = [];
  if (input.boldStatus?.trim().toUpperCase() !== "APPROVED") problems.push("Bold status is not APPROVED");
  if (!input.boldReference || input.boldReference.trim() !== input.orderCode) {
    problems.push("Bold reference_id does not match order");
  }
  if (tx.externalReference !== input.orderCode) problems.push("externalReference does not match order");
  if (typeof input.boldAmount !== "number" || !Number.isInteger(input.boldAmount) || input.boldAmount !== tx.amount) {
    problems.push("Bold amount does not match prepared amount");
  }

  const preparedCurrency = tx.currency.trim().toUpperCase();
  const orderCurrency = input.orderCurrency.trim().toUpperCase();
  if (!preparedCurrency || !orderCurrency || preparedCurrency !== orderCurrency) {
    problems.push("prepared currency does not match order currency");
  }

  if (!tx.signatureHash) {
    problems.push("prepared transaction has no integrity signature");
  } else if (!input.secretKey?.trim()) {
    problems.push("integrity signature cannot be recomputed");
  } else {
    let expected: string | null = null;
    try {
      expected = computeBoldIntegritySignature(tx.externalReference, tx.amount, tx.currency, input.secretKey);
    } catch {
      expected = null;
    }
    if (expected !== tx.signatureHash) problems.push("integrity signature does not match prepared transaction");
  }
  return problems;
}
