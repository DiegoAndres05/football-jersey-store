import { CurrencySelector } from "@/features/system/components/currency-selector";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import { getPublicUsdRate } from "@/features/system/repositories/usd-rate-repository";

/**
 * Server wrapper: el `current` es la moneda visible (USD solo con tasa vigente).
 */
export async function CurrencySelectorServer() {
  const [ctx, rate] = await Promise.all([getCurrencyContext(), getPublicUsdRate()]);

  return (
    <CurrencySelector
      current={ctx.currency}
      rateInfo={rate.available ? rate : null}
    />
  );
}
