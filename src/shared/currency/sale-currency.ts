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

export type PublicUsdRate =
  | { available: false }
  | { available: true; copPerUsd: number };

/**
 * USD visible solo si la cookie es USD y hay tasa vigente.
 * Si no, COP: el selector y los precios no pueden divergir.
 */
export function resolveVisibleCurrency(
  cookie: SaleCurrency,
  rate: PublicUsdRate,
): { currency: SaleCurrency; copPerUsd: number | null } {
  if (cookie === "USD" && rate.available && rate.copPerUsd >= 1) {
    return { currency: "USD", copPerUsd: rate.copPerUsd };
  }
  return { currency: "COP", copPerUsd: rate.available ? rate.copPerUsd : null };
}
