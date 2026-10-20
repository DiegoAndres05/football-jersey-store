/** PayPal USD amounts are decimal strings. Cents stay integers until this format step. */
export function formatUsdCents(cents: number): string | null {
  if (!Number.isInteger(cents) || cents <= 0) return null;
  const whole = Math.trunc(cents / 100);
  const fraction = Math.abs(cents % 100);
  return `${whole}.${String(fraction).padStart(2, "0")}`;
}

export function paypalAmountsEqual(actual: string, expected: string): boolean {
  return actual.trim() === expected.trim();
}

export function isPayPalApproveUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:"
      && (host === "www.paypal.com" || host === "paypal.com" || host === "www.sandbox.paypal.com" || host === "sandbox.paypal.com");
  } catch {
    return false;
  }
}

export type PayPalCaptureCheck = {
  paypalOrderId: string;
  expectedPayPalOrderId: string;
  status: string;
  currency: string;
  value: string;
  customId: string;
  expectedOrderCode: string;
  expectedValue: string;
};

export function paypalCaptureMatches(input: PayPalCaptureCheck): boolean {
  return input.paypalOrderId === input.expectedPayPalOrderId
    && input.status === "COMPLETED"
    && input.currency === "USD"
    && input.customId === input.expectedOrderCode
    && paypalAmountsEqual(input.value, input.expectedValue);
}
