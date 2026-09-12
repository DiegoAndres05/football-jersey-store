import type { Metadata } from "next";
import { CheckoutPageClient } from "@/features/checkout/components/checkout-page-client";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import { NOINDEX_NOFOLLOW } from "@/features/seo/domain/robots-policy";

export const metadata: Metadata = {
  title: "Pago",
  description: "Completa tus datos de contacto y envío para finalizar tu compra.",
  robots: NOINDEX_NOFOLLOW,
};

export default async function CheckoutPage() {
  const currencyCtx = await getCurrencyContext();
  return <CheckoutPageClient currencyContext={currencyCtx} />;
}