import { formatMoney, type Currency } from "@/shared/money/format";

export type PaidOrderEmailLine = {
  productName: string;
  versionName: string;
  sizeName: string;
  quantity: number;
  subtotal: number;
};

export type PaidOrderEmailInput = {
  code: string;
  customerName: string;
  saleCurrency: string;
  exchangeRateCopPerUsd: number | null;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  shippingFullName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string | null;
  shippingCountry: string;
  items: PaidOrderEmailLine[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isDeliverableEmail(value: string | null | undefined): boolean {
  const email = value?.trim() ?? "";
  return email.length > 0 && email.length <= 120 && EMAIL_PATTERN.test(email);
}

function money(amountCop: number, order: PaidOrderEmailInput): string {
  const currency: Currency = order.saleCurrency === "USD" ? "USD" : "COP";
  return formatMoney({
    amountCop,
    currency,
    copPerUsd: order.exchangeRateCopPerUsd ?? undefined,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatPaidOrderEmail(order: PaidOrderEmailInput): { subject: string; text: string; html: string } {
  const address = [
    order.shippingLine1,
    order.shippingLine2?.trim() || null,
    [order.shippingCity, order.shippingState].filter(Boolean).join(", "),
    order.shippingZipCode?.trim() || null,
    order.shippingCountry,
  ].filter((part): part is string => Boolean(part));
  const lines = order.items.map(
    (item) =>
      `${item.productName} · ${item.versionName} · Talla ${item.sizeName} · x${item.quantity} · ${money(item.subtotal, order)}`,
  );
  const subject = `Pedido ${order.code} confirmado`;
  const text = [
    `Hola ${order.customerName},`,
    "",
    `Recibimos el pago de tu pedido ${order.code}.`,
    "",
    "Productos:",
    ...lines.map((line) => `- ${line}`),
    "",
    `Subtotal: ${money(order.subtotal, order)}`,
    `Envío: ${money(order.shippingFee, order)}`,
    `Descuento: ${money(order.discountAmount, order)}`,
    `Total: ${money(order.total, order)}`,
    "",
    "Envío:",
    `Quién recibe: ${order.shippingFullName}`,
    `Teléfono: ${order.shippingPhone}`,
    ...address,
    "",
    "Flashsport",
  ].join("\n");
  const htmlLines = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const htmlAddress = address.map((part) => `<div>${escapeHtml(part)}</div>`).join("");
  const html = [
    `<p>Hola ${escapeHtml(order.customerName)},</p>`,
    `<p>Recibimos el pago de tu pedido <strong>${escapeHtml(order.code)}</strong>.</p>`,
    "<p>Productos:</p>",
    `<ul>${htmlLines}</ul>`,
    `<p>Subtotal: ${escapeHtml(money(order.subtotal, order))}<br>Envío: ${escapeHtml(money(order.shippingFee, order))}<br>Descuento: ${escapeHtml(money(order.discountAmount, order))}<br><strong>Total: ${escapeHtml(money(order.total, order))}</strong></p>`,
    `<p>Envío:<br>Quién recibe: ${escapeHtml(order.shippingFullName)}<br>Teléfono: ${escapeHtml(order.shippingPhone)}<br>${htmlAddress}</p>`,
    "<p>Flashsport</p>",
  ].join("");
  return { subject, text, html };
}
