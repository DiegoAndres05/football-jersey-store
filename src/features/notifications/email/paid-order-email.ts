import { formatMoney, type Currency } from "@/shared/money/format";
import { SITE } from "@/shared/config/site";

export type PaidOrderEmailLine = {
  productName: string;
  versionName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type PaidOrderEmailInput = {
  code: string;
  customerName: string;
  orderedAt: Date;
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
const LOGO_URL = "https://www.flashsports.shop/flashsport-logo.png";
const STORE_URL = "https://www.flashsports.shop/";
const PAGE = "#faf9f7";
const CARD = "#ffffff";
const INK = "#141414";
const MUTED = "#616161";
const LINE = "#e9e4e1";
const WASH = "#f6f4f2";
const FONT = "Inter, Arial, Helvetica, sans-serif";
const DISPLAY = "'Arial Narrow', Arial, Helvetica, sans-serif";

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

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

function shippingAddress(order: PaidOrderEmailInput): string[] {
  return [
    order.shippingLine1,
    order.shippingLine2?.trim() || null,
    [order.shippingCity, order.shippingState].filter(Boolean).join(", "),
    order.shippingZipCode?.trim() || null,
    order.shippingCountry,
  ].filter((part): part is string => Boolean(part));
}

export function formatPaidOrderEmail(order: PaidOrderEmailInput): { subject: string; text: string; html: string } {
  const address = shippingAddress(order);
  const orderedOn = formatOrderDate(order.orderedAt);
  const lines = order.items.map(
    (item) =>
      `${item.productName} · ${item.versionName} · Talla ${item.sizeName} · x${item.quantity} · Precio unitario ${money(item.unitPrice, order)} · Subtotal ${money(item.subtotal, order)}`,
  );
  const subject = `Pedido ${order.code} confirmado`;
  const text = [
    `Hola ${order.customerName},`,
    "",
    "Tu compra está confirmada. Recibimos el pago de tu pedido.",
    "",
    `Pedido: ${order.code}`,
    `Fecha: ${orderedOn}`,
    "",
    "Productos:",
    ...lines.map((line) => `- ${line}`),
    "",
    `Subtotal: ${money(order.subtotal, order)}`,
    `Envío: ${money(order.shippingFee, order)}`,
    `Descuento: ${money(order.discountAmount, order)}`,
    `Total: ${money(order.total, order)}`,
    "",
    "Dirección de entrega:",
    `Quién recibe: ${order.shippingFullName}`,
    `Teléfono: ${order.shippingPhone}`,
    ...address,
    "",
    "Flashsport",
    SITE.tagline,
    SITE.email,
    SITE.whatsappNumber,
    STORE_URL,
  ].join("\n");

  const html = renderHtml(order, address, orderedOn);
  return { subject, text, html };
}

function renderHtml(order: PaidOrderEmailInput, address: string[], orderedOn: string): string {
  const name = escapeHtml(order.customerName);
  const code = escapeHtml(order.code);
  const date = escapeHtml(orderedOn);
  const items = order.items.map((item) => renderItem(item, order)).join("");
  const addressHtml = [
    renderMeta("Quién recibe", order.shippingFullName),
    renderMeta("Teléfono", order.shippingPhone),
    ...address.map((part) => `<div style="margin:0;font-family:${FONT};font-size:14px;line-height:22px;color:${INK};">${escapeHtml(part)}</div>`),
  ].join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(`Pedido ${order.code} confirmado`)}</title>
<style>
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Compra confirmada. Pedido ${code}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${CARD};border:1px solid ${LINE};">
        <tr>
          <td class="pad" align="left" style="padding:28px 32px 20px;background-color:${PAGE};border-bottom:1px solid ${LINE};">
            <a href="${STORE_URL}" style="text-decoration:none;">
              <img src="${LOGO_URL}" alt="Flashsport" width="216" height="36" style="display:block;border:0;outline:none;text-decoration:none;width:216px;max-width:100%;height:auto;">
            </a>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:28px 32px 8px;">
            <p style="margin:0;font-family:${DISPLAY};font-size:13px;line-height:18px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${INK};">Compra confirmada</p>
            <p style="margin:14px 0 0;font-family:${FONT};font-size:16px;line-height:24px;color:${INK};">Hola ${name},</p>
            <p style="margin:8px 0 0;font-family:${FONT};font-size:15px;line-height:24px;color:${MUTED};">Recibimos el pago de tu pedido. Ya está confirmado y lo prepararemos para enviarlo a la dirección que nos diste.</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:20px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${WASH};border:1px solid ${LINE};">
              <tr>
                <td style="padding:14px 16px;" width="50%" valign="top">
                  <div style="font-family:${DISPLAY};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">Pedido</div>
                  <div style="margin-top:4px;font-family:${FONT};font-size:16px;line-height:22px;font-weight:600;color:${INK};">${code}</div>
                </td>
                <td style="padding:14px 16px;" width="50%" valign="top">
                  <div style="font-family:${DISPLAY};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">Fecha</div>
                  <div style="margin-top:4px;font-family:${FONT};font-size:16px;line-height:22px;font-weight:600;color:${INK};">${date}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:28px 32px 0;">
            <p style="margin:0 0 8px;font-family:${DISPLAY};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${INK};">Productos</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${items}
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:8px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${renderAmount("Subtotal", money(order.subtotal, order), false)}
              ${renderAmount("Envío", money(order.shippingFee, order), false)}
              ${renderAmount("Descuento", money(order.discountAmount, order), false)}
              ${renderAmount("Total", money(order.total, order), true)}
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:28px 32px 32px;">
            <p style="margin:0 0 8px;font-family:${DISPLAY};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${INK};">Dirección de entrega</p>
            ${addressHtml}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:20px 32px 28px;background-color:${PAGE};border-top:1px solid ${LINE};">
            <p style="margin:0;font-family:${DISPLAY};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${INK};">Flashsport</p>
            <p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${escapeHtml(SITE.tagline)}</p>
            <p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${escapeHtml(SITE.email)} · ${escapeHtml(SITE.whatsappNumber)}</p>
            <p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:20px;"><a href="${STORE_URL}" style="color:${INK};text-decoration:underline;">flashsports.shop</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function renderItem(item: PaidOrderEmailLine, order: PaidOrderEmailInput): string {
  const detail = `Versión ${item.versionName} · Talla ${item.sizeName} · Cant. ${item.quantity}`;
  return `<tr>
    <td style="padding:14px 0;border-bottom:1px solid ${LINE};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top" style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:600;color:${INK};">${escapeHtml(item.productName)}</td>
          <td valign="top" align="right" style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:600;color:${INK};white-space:nowrap;padding-left:12px;">${escapeHtml(money(item.subtotal, order))}</td>
        </tr>
        <tr>
          <td valign="top" style="padding-top:4px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${escapeHtml(detail)}</td>
          <td valign="top" align="right" style="padding-top:4px;padding-left:12px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};white-space:nowrap;">${escapeHtml(money(item.unitPrice, order))} c/u</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderMeta(label: string, value: string): string {
  return `<div style="margin:0 0 2px;font-family:${FONT};font-size:14px;line-height:22px;color:${INK};">${escapeHtml(label)}: ${escapeHtml(value)}</div>`;
}

function renderAmount(label: string, value: string, emphasis: boolean): string {
  const labelStyle = emphasis
    ? `font-family:${FONT};font-size:16px;line-height:24px;font-weight:700;color:${INK};`
    : `font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};`;
  const valueStyle = emphasis
    ? `font-family:${FONT};font-size:16px;line-height:24px;font-weight:700;color:${INK};`
    : `font-family:${FONT};font-size:14px;line-height:22px;color:${INK};`;
  const padding = emphasis ? "padding:12px 0 0;border-top:1px solid " + LINE + ";" : "padding:4px 0;";
  return `<tr>
    <td style="${padding}${labelStyle}">${escapeHtml(label)}</td>
    <td align="right" style="${padding}${valueStyle}white-space:nowrap;">${escapeHtml(value)}</td>
  </tr>`;
}
