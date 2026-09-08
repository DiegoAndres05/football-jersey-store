/**
 * Bold payment-button attribute rules (BTN-001).
 * @see https://developers.bold.co/pagos-en-linea/boton-de-pagos/integracion-manual/integracion-manual
 */

export const BOLD_ORDER_ID_RE = /^[A-Za-z0-9_-]{1,60}$/;
export const BOLD_CURRENCIES = ["COP", "USD"] as const;

export type BoldCurrency = (typeof BOLD_CURRENCIES)[number];

export type BoldSaleAttrs = {
  orderId: string;
  amount: string;
  currency: BoldCurrency;
};

export type BoldCustomerInput = {
  email?: string;
  fullName?: string;
  phone?: string;
};

export type BoldCheckoutPayload = {
  orderId: string;
  currency: BoldCurrency;
  amount: string;
  apiKey: string;
  integritySignature: string;
  renderMode: "embedded";
  description?: string;
  redirectionUrl?: string;
  customerData?: string;
};

export function formatBoldAmount(amount: number | string): string {
  const n = typeof amount === "number" ? amount : Number(String(amount).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("El monto de Bold debe ser un número mayor o igual a 0.");
  }
  return String(Math.round(n));
}

export function assertBoldOrderId(orderId: string): string {
  const id = orderId.trim();
  if (!BOLD_ORDER_ID_RE.test(id)) {
    throw new Error(
      "El order-id de Bold solo admite letras, números, guiones y guiones bajos (máx. 60).",
    );
  }
  return id;
}

export function assertBoldCurrency(currency: string): BoldCurrency {
  const normalized = currency.trim().toUpperCase();
  if (normalized === "COP" || normalized === "USD") return normalized;
  throw new Error("La moneda de Bold debe ser COP o USD.");
}

export function canonicalizeBoldSale(input: {
  orderId: string;
  amount: number | string;
  currency: string;
}): BoldSaleAttrs {
  return {
    orderId: assertBoldOrderId(input.orderId),
    amount: formatBoldAmount(input.amount),
    currency: assertBoldCurrency(input.currency),
  };
}

export function sanitizeBoldDescription(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const cleaned = text.replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
  if (cleaned.length < 2) return undefined;
  return cleaned.slice(0, 100);
}

export function sanitizeBoldRedirectionUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "127.0.0.1") parsed.hostname = "localhost";
    const isLocalhost = parsed.hostname === "localhost";
    if (parsed.protocol === "https:" || (isLocalhost && parsed.protocol === "http:")) {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function buildBoldCustomerData(input: BoldCustomerInput): string | undefined {
  const email = input.email?.trim();
  const fullName = input.fullName?.trim();
  const digits = (input.phone ?? "").replace(/\D/g, "");

  const payload: Record<string, string> = {};
  if (email) payload.email = email;
  if (fullName) payload.fullName = fullName;
  if (digits.length >= 7) {
    payload.phone = digits.startsWith("57") && digits.length >= 12 ? digits.slice(-10) : digits;
    payload.dialCode = "+57";
  }
  return Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined;
}

export function buildBoldCheckoutPayload(input: {
  orderId: string;
  amount: number | string;
  currency: string;
  apiKey: string;
  integritySignature: string;
  description?: string;
  redirectionUrl?: string;
  customer?: BoldCustomerInput;
}): BoldCheckoutPayload {
  const sale = canonicalizeBoldSale(input);
  const apiKey = input.apiKey.trim();
  const integritySignature = input.integritySignature.trim().toLowerCase();

  if (!apiKey) throw new Error("Falta la llave de identidad de Bold (data-api-key).");
  if (!/^[a-f0-9]{64}$/.test(integritySignature)) {
    throw new Error("La firma de integridad de Bold no tiene el formato SHA-256 esperado.");
  }

  const payload: BoldCheckoutPayload = {
    orderId: sale.orderId,
    currency: sale.currency,
    amount: sale.amount,
    apiKey,
    integritySignature,
    renderMode: "embedded",
  };

  const description = sanitizeBoldDescription(input.description);
  if (description) payload.description = description;

  const redirectionUrl = sanitizeBoldRedirectionUrl(input.redirectionUrl);
  if (redirectionUrl) payload.redirectionUrl = redirectionUrl;

  const customerData = input.customer ? buildBoldCustomerData(input.customer) : undefined;
  if (customerData) payload.customerData = customerData;

  return payload;
}
