import { formatMoney, type Currency } from "@/shared/money/format";
import { SITE } from "@/shared/config/site";

export type PaidOrderEmailLine = {
  productName: string;
  versionName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string | null;
  imageAlt?: string | null;
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
const PRODUCT_IMAGES_BUCKET = "product-images";
const LOGO_URL = "https://www.flashsports.shop/flashsport-logo.png";
const STORE_URL = "https://www.flashsports.shop/";
const PAGE = "#ffffff";
const CARD = "#ffffff";
const INK = "#141414";
const MUTED = "#616161";
const LINE = "#e9e4e1";
const WASH = "#f6f4f2";
const FONT = "Inter, Arial, Helvetica, sans-serif";
const DISPLAY = "'Arial Narrow', Arial, Helvetica, sans-serif";

function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1" && host !== "::1";
  } catch {
    return false;
  }
}

/** Public catalog image. Storage objects use the same public URL as the store; historical rows keep their https url. */
export function resolveEmailProductImageUrl(image: { url: string; storagePath: string | null } | null | undefined): string | null {
  if (!image) return null;
  if (image.storagePath) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
    if (base && isPublicHttpsUrl(base)) {
      const path = image.storagePath.replace(/^\/+/, "");
      return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
    }
  }
  return isPublicHttpsUrl(image.url) ? image.url : null;
}

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
    ...address.map((part) => `<div class="force-ink" style="margin:0;font-family:${FONT};font-size:14px;line-height:22px;color:${INK};">${escapeHtml(part)}</div>`),
  ].join("");

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(`Pedido ${order.code} confirmado`)}</title>
<style>
  :root { color-scheme: light only; supported-color-schemes: light; }
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body class="body force-light" bgcolor="${PAGE}" style="margin:0;padding:0;background-color:${PAGE};color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Compra confirmada. Pedido ${code}.</div>
<table role="presentation" class="force-light" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="background-color:${PAGE};color:${INK};">
  <tr>
    <td class="force-light" align="center" bgcolor="${PAGE}" style="padding:32px 12px;background-color:${PAGE};color:${INK};">
      <table role="presentation" class="container force-light" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="width:600px;max-width:600px;background-color:${CARD};color:${INK};border:1px solid ${LINE};">
        <tr>
          <td class="pad force-light" align="left" bgcolor="${PAGE}" style="padding:28px 32px 20px;background-color:${PAGE};color:${INK};border-bottom:1px solid ${LINE};">
            <a href="${STORE_URL}" style="text-decoration:none;">
              <img src="${LOGO_URL}" alt="Flashsport" width="216" height="36" style="display:block;border:0;outline:none;text-decoration:none;width:216px;max-width:100%;height:auto;">
            </a>
          </td>
        </tr>
        <tr>
          <td class="pad force-light" bgcolor="${CARD}" style="padding:28px 32px 8px;background-color:${CARD};color:${INK};">
            <p class="force-ink" style="margin:0;font-family:${DISPLAY};font-size:13px;line-height:18px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${INK};">Compra confirmada</p>
            <p class="force-ink" style="margin:14px 0 0;font-family:${FONT};font-size:16px;line-height:24px;color:${INK};">Hola ${name},</p>
            <p class="force-muted" style="margin:8px 0 0;font-family:${FONT};font-size:15px;line-height:24px;color:${MUTED};">Recibimos el pago de tu pedido. Ya está confirmado y lo prepararemos para enviarlo a la dirección que nos diste.</p>
          </td>
        </tr>
        <tr>
          <td class="pad force-light" bgcolor="${CARD}" style="padding:20px 32px 0;background-color:${CARD};color:${INK};">
            <table role="presentation" class="force-wash" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${WASH}" style="background-color:${WASH};color:${INK};border:1px solid ${LINE};">
              <tr>
                <td class="force-wash" bgcolor="${WASH}" style="padding:14px 16px;background-color:${WASH};color:${INK};" width="50%" valign="top">
                  <div class="force-muted" style="font-family:${DISPLAY};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">Pedido</div>
                  <div class="force-ink" style="margin-top:4px;font-family:${FONT};font-size:16px;line-height:22px;font-weight:600;color:${INK};">${code}</div>
                </td>
                <td class="force-wash" bgcolor="${WASH}" style="padding:14px 16px;background-color:${WASH};color:${INK};" width="50%" valign="top">
                  <div class="force-muted" style="font-family:${DISPLAY};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">Fecha</div>
                  <div class="force-ink" style="margin-top:4px;font-family:${FONT};font-size:16px;line-height:22px;font-weight:600;color:${INK};">${date}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad force-light" bgcolor="${CARD}" style="padding:28px 32px 0;background-color:${CARD};color:${INK};">
            <p class="force-ink" style="margin:0 0 8px;font-family:${DISPLAY};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${INK};">Productos</p>
            <table role="presentation" class="force-light" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="background-color:${CARD};color:${INK};">
              ${items}
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad force-light" bgcolor="${CARD}" style="padding:8px 32px 0;background-color:${CARD};color:${INK};">
            <table role="presentation" class="force-light" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="background-color:${CARD};color:${INK};">
              ${renderAmount("Subtotal", money(order.subtotal, order), false)}
              ${renderAmount("Envío", money(order.shippingFee, order), false)}
              ${renderAmount("Descuento", money(order.discountAmount, order), false)}
              ${renderAmount("Total", money(order.total, order), true)}
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad force-light" bgcolor="${CARD}" style="padding:28px 32px 32px;background-color:${CARD};color:${INK};">
            <p class="force-ink" style="margin:0 0 8px;font-family:${DISPLAY};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${INK};">Dirección de entrega</p>
            ${addressHtml}
          </td>
        </tr>
        <tr>
          <td class="pad force-light" bgcolor="${PAGE}" style="padding:20px 32px 28px;background-color:${PAGE};color:${INK};border-top:1px solid ${LINE};">
            <p class="force-ink" style="margin:0;font-family:${DISPLAY};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${INK};">Flashsport</p>
            <p class="force-muted" style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${escapeHtml(SITE.tagline)}</p>
            <p class="force-muted" style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${escapeHtml(SITE.email)} · ${escapeHtml(SITE.whatsappNumber)}</p>
            <p class="force-ink" style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:20px;"><a href="${STORE_URL}" style="color:${INK};text-decoration:underline;">flashsports.shop</a></p>
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
  const imageUrl = item.imageUrl && isPublicHttpsUrl(item.imageUrl) ? item.imageUrl : null;
  const alt = escapeHtml(item.imageAlt?.trim() || item.productName);
  const imageCell = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${alt}" width="72" height="72" style="display:block;border:0;outline:none;text-decoration:none;width:72px;height:72px;">`
    : "";
  return `<tr>
    <td class="force-light" bgcolor="${CARD}" style="padding:14px 0;background-color:${CARD};color:${INK};border-bottom:1px solid ${LINE};">
      <table role="presentation" class="force-light" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="background-color:${CARD};color:${INK};">
        <tr>
          <td class="force-light" width="84" valign="top" bgcolor="${CARD}" style="width:84px;padding-right:12px;background-color:${CARD};color:${INK};">${imageCell}</td>
          <td class="force-ink" valign="top" bgcolor="${CARD}" style="font-family:${FONT};font-size:15px;line-height:22px;background-color:${CARD};color:${INK};">
            <div class="force-ink" style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:600;color:${INK};">${escapeHtml(item.productName)}</div>
            <div class="force-muted" style="padding-top:4px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">Versión ${escapeHtml(item.versionName)} · Talla ${escapeHtml(item.sizeName)} · Cant. ${item.quantity}</div>
            <div class="force-muted" style="padding-top:2px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">Precio unitario ${escapeHtml(money(item.unitPrice, order))}</div>
            <div class="force-ink" style="padding-top:2px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;color:${INK};">Subtotal ${escapeHtml(money(item.subtotal, order))}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderMeta(label: string, value: string): string {
  return `<div class="force-ink" style="margin:0 0 2px;font-family:${FONT};font-size:14px;line-height:22px;color:${INK};">${escapeHtml(label)}: ${escapeHtml(value)}</div>`;
}

function renderAmount(label: string, value: string, emphasis: boolean): string {
  const tone = emphasis ? "force-ink" : "force-muted";
  const labelStyle = emphasis
    ? `font-family:${FONT};font-size:16px;line-height:24px;font-weight:700;color:${INK};background-color:${CARD};`
    : `font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};background-color:${CARD};`;
  const valueStyle = emphasis
    ? `font-family:${FONT};font-size:16px;line-height:24px;font-weight:700;color:${INK};background-color:${CARD};`
    : `font-family:${FONT};font-size:14px;line-height:22px;color:${INK};background-color:${CARD};`;
  const padding = emphasis ? "padding:12px 0 0;border-top:1px solid " + LINE + ";" : "padding:4px 0;";
  return `<tr>
    <td class="${tone}" bgcolor="${CARD}" style="${padding}${labelStyle}">${escapeHtml(label)}</td>
    <td class="force-ink" align="right" bgcolor="${CARD}" style="${padding}${valueStyle}white-space:nowrap;">${escapeHtml(value)}</td>
  </tr>`;
}
