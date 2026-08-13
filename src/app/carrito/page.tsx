import type { Metadata } from "next";
import { CartPageClient } from "@/features/cart/components/cart-page-client";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa los artículos de tu carrito y continúa con tu compra.",
};

export default function CartPage() {
  return <CartPageClient />;
}