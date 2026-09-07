import "server-only";
import { createHmac } from "node:crypto";

const BOLD_API_BASE = "https://api.online.payments.bold.co";

function getBoldConfig() {
  const identityKey = process.env.BOLD_IDENTITY_KEY;
  const secretKey = process.env.BOLD_SECRET_KEY;
  if (!identityKey || !secretKey) {
    throw new Error("Faltan BOLD_IDENTITY_KEY o BOLD_SECRET_KEY en las variables de entorno.");
  }
  return { identityKey, secretKey };
}

/**
 * Generate integrity hash for Bold checkout.
 * Hash = SHA-256({orderId}{amount}{currency}{secretKey})
 * Must be generated server-side (secret key never exposed to frontend).
 */
export function generateBoldIntegrityHash(orderId: string, amount: number, currency: string): string {
  const { secretKey } = getBoldConfig();
  const data = `${orderId}${amount}${currency}${secretKey}`;
  return createHmac("sha256", secretKey).update(data).digest("hex");
}

/**
 * Get the Bold identity key for the frontend.
 */
export function getBoldPublicKey(): string {
  const { identityKey } = getBoldConfig();
  return identityKey;
}

/**
 * Verify a webhook signature from Bold.
 * Bold signs webhooks with HMAC-SHA256 using the secret key.
 */
export function verifyBoldWebhookSignature(payload: string, signature: string): boolean {
  const { secretKey } = getBoldConfig();
  const expected = createHmac("sha256", secretKey).update(payload).digest("hex");
  return signature === expected;
}

/**
 * Query Bold API for transaction status by reference_id.
 */
export async function getBoldTransactionStatus(referenceId: string): Promise<{
  status: string;
  transactionId?: string;
  paymentMethod?: string;
  amount?: number;
} | null> {
  const { identityKey } = getBoldConfig();
  try {
    const res = await fetch(`${BOLD_API_BASE}/v1/payment/${referenceId}`, {
      headers: { "Authorization": `x-api-key ${identityKey}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      status: data.payload?.status ?? data.status,
      transactionId: data.payload?.transaction_id ?? data.transaction_id,
      paymentMethod: data.payload?.payment_method ?? data.payment_method,
      amount: data.payload?.amount?.total_amount ?? data.amount?.total_amount,
    };
  } catch {
    return null;
  }
}
