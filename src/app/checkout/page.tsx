import type { Metadata } from "next";
import { CheckoutPageClient } from "@/features/checkout/components/checkout-page-client";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import { NOINDEX_NOFOLLOW } from "@/features/seo/domain/robots-policy";
import { getLegalConfig } from "@/shared/config/legal";

export const metadata: Metadata = {
  title: "Pago",
  description: "Completa tus datos de contacto y envío para finalizar tu compra.",
  robots: NOINDEX_NOFOLLOW,
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ paypal?: string }>;
}) {
  const currencyCtx = await getCurrencyContext();
  const params = await searchParams;
  const paypalNotice = params.paypal === "cancelled" || params.paypal === "error" ? params.paypal : null;
  return <CheckoutPageClient currencyContext={currencyCtx} legalConfig={getLegalConfig()} paypalNotice={paypalNotice} />;
}