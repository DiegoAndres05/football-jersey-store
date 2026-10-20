import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SHIPPING_RATES,
  parseShippingFee,
  type ShippingRates,
} from "@/features/checkout/shipping";

const NATIONAL_KEY = "shipping_national_fee_cop";
const INTERNATIONAL_KEY = "shipping_international_fee_cop";

export async function getShippingRates(): Promise<ShippingRates> {
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
