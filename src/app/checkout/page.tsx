import type { Metadata } from "next";
import { CheckoutPageClient } from "@/features/checkout/components/checkout-page-client";
import { getCurrencyContext } from "@/shared/money/server-helpers";

export const metadata: Metadata = {
  title: "Pago",
  description: "Completa tus datos de contacto y envío para finalizar tu compra.",
};

export default async function CheckoutPage() {
  const currencyCtx = await getCurrencyContext();
  return <CheckoutPageClient currencyContext={currencyCtx} />;
}