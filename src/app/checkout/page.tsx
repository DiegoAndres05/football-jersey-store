import type { Metadata } from "next";
import { CheckoutPageClient } from "@/features/checkout/components/checkout-page-client";

export const metadata: Metadata = {
  title: "Pago",
  description: "Completa tus datos de contacto y envío para finalizar tu compra.",
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}