"use server";

import { checkoutFormSchema, type CheckoutFormValues } from "@/features/checkout/schemas/checkout-schema";
import { createOrder, type OrderLineInput } from "@/features/orders/create-order";
import type { PaymentMethod } from "@/features/checkout/schemas/checkout-schema";

export async function createCheckoutOrder(input: {
  form: CheckoutFormValues;
  lines: OrderLineInput[];
  paymentMethod: PaymentMethod;
  paymentReference: string;
  couponCode?: string | null;
}) {
  const parsed = checkoutFormSchema.safeParse(input.form);
  if (!parsed.success) return { ok: false as const, error: "Revisa los campos y las tres autorizaciones del checkout." };
  return createOrder({ ...input, form: parsed.data, saleCurrency: "COP" });
}
