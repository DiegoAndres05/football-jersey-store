import { cookies } from "next/headers";
import { CurrencySelector } from "@/features/system/components/currency-selector";
import { getPublicUsdRate } from "@/features/system/repositories/usd-rate-repository";
import { getSaleCurrencyFromCookies } from "@/shared/currency/sale-currency";

/**
 * Server wrapper que lee la cookie y la tasa, y renderiza el selector de moneda.
 */
export async function CurrencySelectorServer() {
  const cookieStore = await cookies();
  const currency = getSaleCurrencyFromCookies(cookieStore);
  const rate = await getPublicUsdRate();

  return (
    <CurrencySelector
      current={currency}
      rateInfo={rate.available ? rate : null}
    />
  );
}
