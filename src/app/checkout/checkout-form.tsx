"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CheckoutFormValues } from "@/features/checkout/schemas/checkout-schema";

/**
 * Contract marker for the guest checkout form. The page currently composes
 * these fields inline to preserve its existing responsive layout; consumers
 * can use this typed field contract when embedding checkout.
 */
export type GuestCheckoutFormProps = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

export function isGuestCheckoutForm(value: unknown): value is GuestCheckoutFormProps {
  return Boolean(value && typeof value === "object");
}
