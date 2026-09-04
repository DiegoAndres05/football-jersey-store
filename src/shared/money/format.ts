import { toUsdCents } from "./convert.ts";

export type Currency = "COP" | "USD";

export interface MoneyInput {
  /** Importe en COP (entero) */
  amountCop: number;
  /** Moneda de visualización */
  currency: Currency;
  /** Tasa vigente: COP por 1 USD (entero ≥ 1). Requerida si currency=USD. */
  copPerUsd?: number;
}

/**
 * Formatea un importe individual para mostrar al cliente.
 * COP: "$ 15.000" con código.
 * USD: "USD 3.75" con código.
 */
export function formatMoney(input: MoneyInput): string {
  const { amountCop, currency } = input;

  if (currency === "COP") {
    return formatCop(amountCop);
  }

  const { copPerUsd } = input;
  if (!copPerUsd || copPerUsd <= 0) {
    // No disfrazar USD como COP ($89.900). El contexto visible debe coercer a COP antes.
    return "USD —";
  }

  const usdCents = toUsdCents(amountCop, copPerUsd);
  return formatUsd(usdCents);
}

/**
 * Formatea el total de un pedido/carrito.
 * En USD, el total se convierte una sola vez desde el total COP (no suma de líneas).
 */
export function formatMoneyTotal(input: MoneyInput): string {
  return formatMoney(input);
}

function formatCop(amountCop: number): string {
  // COP es entero, sin decimales
  const formatted = amountCop.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted} COP`;
}

function formatUsd(usdCents: number): string {
  // USD usa 2 decimales
  const dollars = usdCents / 100;
  const formatted = dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} USD`;
}
