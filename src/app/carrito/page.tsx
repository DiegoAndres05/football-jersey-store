import type { Metadata } from "next";
import { CartPageClient } from "@/features/cart/components/cart-page-client";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import { getShippingRates } from "@/features/system/repositories/shipping-rates-repository";
import { NOINDEX_NOFOLLOW } from "@/features/seo/domain/robots-policy";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa los artículos de tu carrito y continúa con tu compra.",
  robots: NOINDEX_NOFOLLOW,
};

export default async function CartPage() {
  const [currencyCtx, shippingRates] = await Promise.all([getCurrencyContext(), getShippingRates()]);
  return <CartPageClient currencyContext={currencyCtx} shippingRates={shippingRates} />;
}