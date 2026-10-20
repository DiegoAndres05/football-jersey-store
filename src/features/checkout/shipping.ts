import { SHIPPING } from "@/shared/config/site";
import { normalizeCountry } from "./validation";

export const SHIPPING_FEE_MAX_COP = 5_000_000;

export type ShippingRates = {
  nationalFeeCop: number;
  internationalFeeCop: number;
};

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  nationalFeeCop: SHIPPING.flatFee,
  internationalFeeCop: 0,
};

export type ShippingScope = "NATIONAL" | "INTERNATIONAL" | "INTERNATIONAL_QUOTE_PENDING";
export type ShippingQuote = {
  country: string;
  currency: "COP";
  shippingScope: ShippingScope;
  fee: number;
  freeThreshold: number;
  chargeable: boolean;
  ruleVersion: string;
};

export function isShippingFeeCop(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= SHIPPING_FEE_MAX_COP;
}

/** Si el valor guardado no es un entero válido, se usa la tarifa de respaldo. */
export function parseShippingFee(value: string | null | undefined, fallback: number): number {
  if (value == null || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return isShippingFeeCop(parsed) ? parsed : fallback;
}

export function nationalShippingFee(merchandiseTotalCop: number, nationalFeeCop: number): number {
  return merchandiseTotalCop >= SHIPPING.freeThreshold ? 0 : nationalFeeCop;
}

/** Cotiza el envío. Bold solo queda habilitado en Colombia. */
export function quoteShipping(
  country: string,
  merchandiseTotalCop: number,
  rates: ShippingRates = DEFAULT_SHIPPING_RATES,
): ShippingQuote {
  const normalized = normalizeCountry(country);
  const national = normalized === "CO";
  const internationalFee = rates.internationalFeeCop;
  return {
    country: normalized,
    currency: "COP",
    shippingScope: national ? "NATIONAL" : internationalFee > 0 ? "INTERNATIONAL" : "INTERNATIONAL_QUOTE_PENDING",
    fee: national ? nationalShippingFee(merchandiseTotalCop, rates.nationalFeeCop) : internationalFee,
    freeThreshold: SHIPPING.freeThreshold,
    chargeable: national,
    ruleVersion: `NAT-${rates.nationalFeeCop}-FREE-${SHIPPING.freeThreshold}-INTL-${internationalFee}`,
  };
}

export function isChargeableDestination(country: string): boolean {
  return quoteShipping(country, 0).chargeable;
}
