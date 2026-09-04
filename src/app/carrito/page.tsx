import type { Metadata } from "next";
import { CartPageClient } from "@/features/cart/components/cart-page-client";
import { getCurrencyContext } from "@/shared/money/server-helpers";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa los artículos de tu carrito y continúa con tu compra.",
};

export default async function CartPage() {
  const currencyCtx = await getCurrencyContext();
  return <CartPageClient currencyContext={currencyCtx} />;
}