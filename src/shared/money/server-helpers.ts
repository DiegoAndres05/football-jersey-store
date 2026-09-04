import { cookies } from "next/headers";
import { getPublicUsdRate } from "@/features/system/repositories/usd-rate-repository";
import {
  getSaleCurrencyFromCookies,
  resolveVisibleCurrency,
  type SaleCurrency,
} from "@/shared/currency/sale-currency";
import { formatMoney, formatMoneyTotal } from "@/shared/money/format";

export interface CurrencyContext {
  currency: SaleCurrency;
  copPerUsd: number | null;
}

/**
 * Lee la moneda del visitante y la tasa vigente desde el servidor.
 * Se usa en Server Components para formatear precios.
 */
export async function getCurrencyContext(): Promise<CurrencyContext> {
  const cookieStore = await cookies();
  const cookie = getSaleCurrencyFromCookies(cookieStore);
  const rate = await getPublicUsdRate();
  return resolveVisibleCurrency(cookie, rate);
}

/**
 * Formatea un precio usando el contexto de moneda del visitante.
 */
export function formatPriceWithCurrency(
  amountCop: number,
  ctx: CurrencyContext,
): string {
  return formatMoney({
    amountCop,
    currency: ctx.currency,
    copPerUsd: ctx.copPerUsd ?? undefined,
  });
}

/**
 * Formatea el total de un pedido/carrito usando el contexto de moneda.
 */
export function formatTotalWithCurrency(
  totalCop: number,
  ctx: CurrencyContext,
): string {
  return formatMoneyTotal({
    amountCop: totalCop,
    currency: ctx.currency,
    copPerUsd: ctx.copPerUsd ?? undefined,
  });
}
