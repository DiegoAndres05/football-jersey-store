import { z } from "zod";

/**
 * Esquema Zod para la tasa USD que el admin guarda desde /admin/ajustes.
 * La tasa se expresa como "COP por 1 USD" (ej. 4000 = $4.000 por $1 USD).
 */
export const usdRateSchema = z.object({
  copPerUsd: z
    .coerce.number()
    .int("La tasa debe ser un número entero.")
    .min(1, "La tasa debe ser al menos 1 COP por 1 USD."),
  enabled: z.coerce.boolean(),
});

export type UsdRateInput = z.infer<typeof usdRateSchema>;

/**
 * Valida el input del form de ajustes y retorna el resultado seguro.
 */
export function validateUsdRate(formData: FormData) {
  return usdRateSchema.safeParse({
    copPerUsd: formData.get("copPerUsd"),
    enabled: formData.get("enabled"),
  });
}
