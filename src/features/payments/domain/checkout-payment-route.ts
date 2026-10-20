import { normalizeCountry } from "@/features/checkout/validation";
import type { PaymentMethod } from "@/features/checkout/schemas/checkout-schema";
import type { SaleCurrency } from "@/shared/currency/sale-currency";

export type CheckoutPaymentRoute = "BOLD" | "PAYPAL";

export type CheckoutPaymentDecision =
  | { ok: true; route: CheckoutPaymentRoute; saleCurrency: SaleCurrency }
  | { ok: false; error: string };

/** Colombia pays with Bold in COP. Every other destination pays with PayPal in USD. */
export function resolveCheckoutPayment(country: string, paymentMethod: PaymentMethod): CheckoutPaymentDecision {
  const destination = normalizeCountry(country);
  if (destination === "CO") {
    if (paymentMethod === "PAYPAL") {
      return { ok: false, error: "En Colombia el pago se completa con Bold." };
    }
    return { ok: true, route: "BOLD", saleCurrency: "COP" };
  }
  if (paymentMethod !== "PAYPAL") {
    return { ok: false, error: "Los destinos fuera de Colombia se pagan con PayPal." };
  }
  return { ok: true, route: "PAYPAL", saleCurrency: "USD" };
}
