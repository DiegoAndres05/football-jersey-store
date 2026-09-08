import { createHash } from "node:crypto";
import { canonicalizeBoldSale } from "./bold-checkout-attrs";

/**
 * Bold integrity signature for a defined-amount payment button.
 *
 * SHA-256 hex of `{orderId}{amount}{currency}{secretKey}` — not HMAC.
 * @see https://developers.bold.co/pagos-en-linea/boton-de-pagos/integracion-manual/integracion-manual
 */
export function computeBoldIntegritySignature(
  orderId: string,
  amount: number | string,
  currency: string,
  secretKey: string,
): string {
  const sale = canonicalizeBoldSale({ orderId, amount, currency });
  const secret = secretKey.trim();
  if (!secret) throw new Error("Falta la llave secreta de Bold.");
  const concatenated = `${sale.orderId}${sale.amount}${sale.currency}${secret}`;
  return createHash("sha256").update(concatenated, "utf8").digest("hex");
}
