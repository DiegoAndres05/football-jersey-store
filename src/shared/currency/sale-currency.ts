/**
 * Preferencia de moneda de venta del visitante.
 * Persistida en cookie `sale_currency`; leída en servidor y cliente.
 */

export const SALE_CURRENCY_COOKIE = "sale_currency";

export type SaleCurrency = "COP" | "USD";

const VALID: ReadonlySet<string> = new Set(["COP", "USD"]);

/**
 * Parsea el valor de la cookie a un `SaleCurrency` válido.
 * Cualquier valor inválido (ausente, corrupto, distinto de COP/USD) devuelve "COP".
 */
export function parseSaleCurrency(raw: string | undefined | null): SaleCurrency {
  if (!raw) return "COP";
  const upper = raw.toUpperCase();
  return VALID.has(upper) ? (upper as SaleCurrency) : "COP";
}

/**
 * Lee la preferencia de moneda desde las cookies del servidor.
 * `cookies()` de next/headers debe estar disponible en el caller.
 */
export function getSaleCurrencyFromCookies(
  cookieStore: { get(name: string): { value: string } | undefined },
): SaleCurrency {
  return parseSaleCurrency(cookieStore.get(SALE_CURRENCY_COOKIE)?.value);
}
