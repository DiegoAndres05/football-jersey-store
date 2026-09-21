import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { canonicalizeBoldSale } from "@/features/payments/domain/bold-checkout-attrs";
import { computeBoldIntegritySignature } from "@/features/payments/domain/bold-integrity";
import { canOpenBold, getPaymentConfig } from "@/shared/config/payment";

const BOLD_API_BASE = "https://payments.api.bold.co";

function getBoldConfig() {
  const config = getPaymentConfig();
  if (config.provider !== "bold-sandbox" || !config.ready || !config.identityKey || !config.secretKey) {
    throw new Error("Bold no está habilitado en modo sandbox.");
  }
  return { identityKey: config.identityKey, secretKey: config.secretKey };
}

/**
 * Generate integrity hash for Bold checkout.
 * Hash = SHA-256 of {orderId}{amount}{currency}{secretKey}
 * Must be generated server-side (secret key never exposed to frontend).
 * Amount must be integer (no decimals) per Bold docs.
 */
export function generateBoldIntegrityHash(
  orderId: string,
  amount: number | string,
  currency: string,
): string {
  const { secretKey } = getBoldConfig();
  return computeBoldIntegritySignature(orderId, amount, currency, secretKey);
}

export function prepareBoldPayment(input: {
  orderId: string;
  amount: number | string;
  currency: string;
}) {
  const { identityKey, secretKey } = getBoldConfig();
  const sale = canonicalizeBoldSale(input);
  return {
    ...sale,
    hash: computeBoldIntegritySignature(sale.orderId, sale.amount, sale.currency, secretKey),
    apiKey: identityKey,
  };
}

/**
 * Prepares the exact amount stored on an order. Client supplied totals are
 * deliberately not accepted here: the order snapshot is the payment authority.
 * The upsert makes retries of hash preparation safe and reuses one reference.
 */
export async function prepareBoldTransaction(orderCode: string) {
  const { identityKey, secretKey } = getBoldConfig();
  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    include: { boldTransaction: true, shippingSnapshot: true },
  });
  if (!order) throw new Error("Pedido no encontrado.");
  const country = order.shippingCountry.trim().toUpperCase();
  if (!canOpenBold({ provider: "bold-sandbox", ready: true, identityKey, secretKey }, {
    country: country === "COLOMBIA" ? "CO" : country,
    currency: order.saleCurrency,
    total: order.total,
  }) || !order.shippingSnapshot?.chargeable) {
    throw new Error("El pedido no cumple las condiciones de pago Bold.");
  }
  if (order.status !== "PENDING_PAYMENT") throw new Error("El pedido ya no está pendiente de pago.");
  const sale = canonicalizeBoldSale({ orderId: order.code, amount: order.total, currency: "COP" });
  const hash = computeBoldIntegritySignature(sale.orderId, sale.amount, sale.currency, secretKey);
  const idempotencyKey = `bold:${sale.orderId}:${sale.amount}:${sale.currency}`;
  const transaction = order.boldTransaction
    ? (() => {
        if (
          order.boldTransaction.externalReference !== sale.orderId ||
          order.boldTransaction.amount !== Number(sale.amount) ||
          order.boldTransaction.currency !== sale.currency ||
          order.boldTransaction.idempotencyKey !== idempotencyKey
        ) {
          throw new Error("La transacción Bold no coincide con el snapshot del pedido.");
        }
        return order.boldTransaction;
      })()
    : await prisma.boldTransaction.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          externalReference: sale.orderId,
          amount: Number(sale.amount),
          currency: sale.currency,
          signatureHash: hash,
          mode: "sandbox",
          status: "PREPARED",
          idempotencyKey,
        },
        update: { signatureHash: hash },
      });
  return { orderId: sale.orderId, amount: sale.amount, currency: sale.currency, hash, apiKey: identityKey, idempotencyKey, transactionId: transaction.id };
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
  const received = signature.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}

/**
 * Query Bold API for transaction status by reference_id.
 *
 * Reference ID = the `orderId` sent to Bold during checkout (our order code).
 * Bold API: GET https://payments.api.bold.co/v2/payment-voucher/{referenceId}
 * Auth: x-api-key <identityKey>
 * Response: { payment_status, transaction_id, payment_method, total, reference_id, ... }
 *
 * Returns null on network errors, HTTP errors, or missing env vars.
 */
export async function getBoldTransactionStatus(referenceId: string): Promise<{
  status: string;
  transactionId?: string;
  paymentMethod?: string;
  amount?: number;
  currency?: string;
  referenceId?: string;
} | null> {
  let identityKey: string;
  try {
    ({ identityKey } = getBoldConfig());
  } catch {
    console.error("[Bold API] Missing BOLD_IDENTITY_KEY or BOLD_SECRET_KEY — cannot query transaction status.");
    return null;
  }

  try {
    const url = `${BOLD_API_BASE}/v2/payment-voucher/${encodeURIComponent(referenceId)}`;
    console.log(`[Bold API] Querying transaction status for ${referenceId}`);
    const res = await fetch(url, {
      headers: { Authorization: `x-api-key ${identityKey}` },
    });

    if (!res.ok) {
      console.warn(`[Bold API] HTTP ${res.status} for reference ${referenceId}`);
      return null;
    }

    const data = await res.json();

    const status: string | undefined =
      data.payment_status ?? data.status ?? data.payload?.status;

    if (!status) {
      console.warn(`[Bold API] Missing payment_status in response for ${referenceId}`);
      return null;
    }

    console.log(`[Bold API] Transaction ${referenceId}: status=${status}`);

    return {
      status,
      transactionId: data.transaction_id ?? data.payload?.transaction_id,
      paymentMethod: data.payment_method ?? data.payload?.payment_method,
      amount: data.total ?? data.amount?.total_amount,
      currency: data.currency ?? data.amount?.currency,
      referenceId: data.reference_id,
    };
  } catch (err) {
    console.error(`[Bold API] Network error querying ${referenceId}:`, err);
    return null;
  }
}
