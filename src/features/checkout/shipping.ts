import { SHIPPING, shippingFee } from "@/shared/config/site";
import { normalizeCountry } from "./validation";

export type ShippingScope = "NATIONAL" | "INTERNATIONAL_QUOTE_PENDING";
export type ShippingQuote = {
  country: string;
  currency: "COP";
  shippingScope: ShippingScope;
  fee: number;
  freeThreshold: number;
  chargeable: boolean;
  ruleVersion: string;
};

/** The only destination currently supported for checkout payment. */
export function quoteShipping(country: string, merchandiseTotalCop: number): ShippingQuote {
  const normalized = normalizeCountry(country);
  const national = normalized === "CO";
  return {
    country: normalized,
    currency: "COP",
    shippingScope: national ? "NATIONAL" : "INTERNATIONAL_QUOTE_PENDING",
    fee: national ? shippingFee(merchandiseTotalCop) : 0,
    freeThreshold: SHIPPING.freeThreshold,
    chargeable: national,
    ruleVersion: "CO-FLAT-15000-FREE-200000-v1",
  };
}

export function isChargeableDestination(country: string): boolean {
  return quoteShipping(country, 0).chargeable;
}
