import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PUBLIC_READ_REVALIDATE_SECONDS, PUBLIC_SETTINGS_TAG } from "@/shared/cache/public-store";
import {
  DEFAULT_SHIPPING_RATES,
  parseShippingFee,
  type ShippingRates,
} from "@/features/checkout/shipping";

const NATIONAL_KEY = "shipping_national_fee_cop";
const INTERNATIONAL_KEY = "shipping_international_fee_cop";

async function loadShippingRates(): Promise<ShippingRates> {
  try {
    const [national, international] = await Promise.all([
      prisma.setting.findUnique({ where: { key: NATIONAL_KEY } }),
      prisma.setting.findUnique({ where: { key: INTERNATIONAL_KEY } }),
    ]);
    return {
      nationalFeeCop: parseShippingFee(national?.value, DEFAULT_SHIPPING_RATES.nationalFeeCop),
      internationalFeeCop: parseShippingFee(international?.value, DEFAULT_SHIPPING_RATES.internationalFeeCop),
    };
  } catch (error) {
    console.error("[shipping] no se pudieron leer las tarifas:", error);
    return DEFAULT_SHIPPING_RATES;
  }
}

export const getShippingRates = unstable_cache(loadShippingRates, ["public-shipping-rates-v1"], {
  revalidate: PUBLIC_READ_REVALIDATE_SECONDS,
  tags: [PUBLIC_SETTINGS_TAG],
});

export async function persistShippingRates(rates: ShippingRates): Promise<ShippingRates> {
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: NATIONAL_KEY },
      update: { value: String(rates.nationalFeeCop) },
      create: { key: NATIONAL_KEY, value: String(rates.nationalFeeCop) },
    }),
    prisma.setting.upsert({
      where: { key: INTERNATIONAL_KEY },
      update: { value: String(rates.internationalFeeCop) },
      create: { key: INTERNATIONAL_KEY, value: String(rates.internationalFeeCop) },
    }),
  ]);
  return rates;
}
