import { createHmac, timingSafeEqual } from "node:crypto";

export type BoldWebhookMode = "sandbox" | "live";

export type BoldWebhookEvent = {
  type: string | null;
  reference: string | null;
  amount: number;
  currency: string;
  paymentId: string | null;
};

/** Bold signs sandbox webhooks with an empty key and live ones with the secret key. */
export function boldWebhookSigningKey({ mode, secretKey }: { mode: BoldWebhookMode; secretKey: string }): string {
  return mode === "sandbox" ? "" : secretKey;
}

/** Bold's signature is hex(HMAC-SHA256(key, base64(rawBody))). */
export function computeBoldWebhookSignature(rawBody: string, key: string): string {
  const encoded = Buffer.from(rawBody, "utf8").toString("base64");
  return createHmac("sha256", key).update(encoded).digest("hex");
}

export function isValidBoldWebhookSignature(rawBody: string, signature: string, key: string): boolean {
  const received = signature.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(received)) return false;
  const expected = computeBoldWebhookSignature(rawBody, key);
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}

type RawEvent = {
  type?: unknown;
  subject?: unknown;
  reference_id?: unknown;
  data?: {
    payment_id?: unknown;
    reference_id?: unknown;
    metadata?: { reference?: unknown } | null;
    amount?: { total?: unknown; total_amount?: unknown; currency?: unknown } | number | string | null;
    total?: unknown;
    currency?: unknown;
  } | null;
};

function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/**
 * For the payment button, Bold returns our order code as
 * `data.metadata.reference`. Older field names are kept as fallbacks.
 */
export function parseBoldWebhookEvent(payload: unknown): BoldWebhookEvent {
  const event = (payload ?? {}) as RawEvent;
  const data = event.data ?? {};
  const amountObject = typeof data.amount === "object" && data.amount !== null ? data.amount : null;
  const rawAmount = amountObject ? amountObject.total ?? amountObject.total_amount : data.amount ?? data.total;
  const rawCurrency = amountObject?.currency ?? data.currency;
  return {
    type: text(event.type),
    reference: text(data.metadata?.reference) ?? text(data.reference_id) ?? text(event.reference_id),
    amount: Number(rawAmount),
    currency: (text(rawCurrency) ?? "").toUpperCase(),
    paymentId: text(data.payment_id) ?? text(event.subject),
  };
}
