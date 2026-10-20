import { isPayPalApproveUrl } from "./paypal-amount";

export type ParsedPayPalOrder = {
  id: string;
  status: string;
  customId: string;
  currency: string;
  value: string;
  captureId: string | null;
  captureStatus: string | null;
  captureCurrency: string | null;
  captureValue: string | null;
  approveUrl: string | null;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parsePayPalOrder(payload: unknown): ParsedPayPalOrder | null {
  if (!payload || typeof payload !== "object") return null;
  const order = payload as {
    id?: unknown;
    status?: unknown;
    links?: Array<{ rel?: unknown; href?: unknown }>;
    purchase_units?: Array<{
      custom_id?: unknown;
      amount?: { currency_code?: unknown; value?: unknown };
      payments?: { captures?: Array<{ id?: unknown; status?: unknown; amount?: { currency_code?: unknown; value?: unknown } }> };
    }>;
  };
  const unit = order.purchase_units?.[0];
  const id = readString(order.id);
  const customId = readString(unit?.custom_id);
  const currency = readString(unit?.amount?.currency_code).toUpperCase();
  const value = readString(unit?.amount?.value);
  if (!id || !customId || !currency || !value) return null;
  const capture = unit?.payments?.captures?.[0];
  const approve = order.links?.find((link) => readString(link.rel) === "payer-action" || readString(link.rel) === "approve");
  const approveUrl = readString(approve?.href);
  return {
    id,
    status: readString(order.status).toUpperCase(),
    customId,
    currency,
    value,
    captureId: readString(capture?.id) || null,
    captureStatus: readString(capture?.status).toUpperCase() || null,
    captureCurrency: readString(capture?.amount?.currency_code).toUpperCase() || null,
    captureValue: readString(capture?.amount?.value) || null,
    approveUrl: approveUrl && isPayPalApproveUrl(approveUrl) ? approveUrl : null,
  };
}

export function paypalPaymentRef(paypalOrderId: string): string {
  return `paypal:${paypalOrderId}`;
}

export function paypalOrderIdFromRef(paymentRef: string | null | undefined): string | null {
  if (!paymentRef?.startsWith("paypal:")) return null;
  const id = paymentRef.slice("paypal:".length).trim();
  return /^[A-Za-z0-9]+$/.test(id) ? id : null;
}

export type ParsedPayPalCaptureEvent = {
  captureId: string;
  status: string;
  currency: string;
  value: string;
  customId: string;
  paypalOrderId: string;
};

export function parsePayPalCaptureEvent(payload: unknown): ParsedPayPalCaptureEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const event = payload as { event_type?: unknown; resource?: Record<string, unknown> };
  if (readString(event.event_type) !== "PAYMENT.CAPTURE.COMPLETED") return null;
  const resource = event.resource;
  if (!resource || typeof resource !== "object") return null;
  const amount = resource.amount as { currency_code?: unknown; value?: unknown } | undefined;
  const related = (resource.supplementary_data as { related_ids?: { order_id?: unknown } } | undefined)?.related_ids;
  const captureId = readString(resource.id);
  const customId = readString(resource.custom_id);
  const paypalOrderId = readString(related?.order_id);
  const currency = readString(amount?.currency_code).toUpperCase();
  const value = readString(amount?.value);
  const status = readString(resource.status).toUpperCase();
  if (!captureId || !customId || !paypalOrderId || !currency || !value || status !== "COMPLETED") return null;
  return { captureId, status, currency, value, customId, paypalOrderId };
}
