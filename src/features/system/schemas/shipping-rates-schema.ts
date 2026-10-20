import { z } from "zod";
import { SHIPPING_FEE_MAX_COP } from "@/features/checkout/shipping";

const fee = z.coerce
  .number()
  .int("El precio debe ser un número entero de pesos.")
  .min(0, "El precio no puede ser negativo.")
  .max(SHIPPING_FEE_MAX_COP, "El precio de envío es demasiado alto.");

export const shippingRatesSchema = z.object({
  nationalFeeCop: fee,
  internationalFeeCop: fee,
});

export function validateShippingRates(formData: FormData) {
  return shippingRatesSchema.safeParse({
    nationalFeeCop: formData.get("nationalFeeCop"),
    internationalFeeCop: formData.get("internationalFeeCop"),
  });
}
