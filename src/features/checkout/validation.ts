export type ConsentType = "TERMS" | "PRIVACY" | "DATA_PROCESSING";
export type CheckoutErrorCode =
  | "INVALID_COUNTRY"
  | "INVALID_CURRENCY"
  | "LEGAL_NOT_CONFIGURED"
  | "CONSENT_REQUIRED"
  | "INVALID_AMOUNT"
  | "OUT_OF_STOCK";
export type CountryCode = "CO" | (string & {});

export type ActionableError = { code: CheckoutErrorCode; message: string; field?: string };

export function isCopAmount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function normalizeCountry(value: string): string {
  const normalized = value.trim().toUpperCase();
  return normalized === "COLOMBIA" || normalized === "COL" ? "CO" : normalized;
}

export function validateCountry(country: string): ActionableError | null {
  return normalizeCountry(country) === "CO"
    ? null
    : { code: "INVALID_COUNTRY", message: "Los destinos internacionales quedan pendientes de cotización." };
}

export function validateConsents(consents: Partial<Record<ConsentType, boolean>>): ActionableError[] {
  return (["TERMS", "PRIVACY", "DATA_PROCESSING"] as const)
    .filter((type) => consents[type] !== true)
    .map((type) => ({ code: "CONSENT_REQUIRED" as const, field: type, message: `Debes aceptar ${type === "TERMS" ? "los términos y condiciones" : type === "PRIVACY" ? "la política de privacidad" : "el tratamiento de datos"}.` }));
}
