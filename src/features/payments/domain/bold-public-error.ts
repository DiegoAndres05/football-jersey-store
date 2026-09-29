const PUBLIC_MESSAGE_MARKERS = [
  "order-id",
  "monto",
  "moneda",
  "condiciones",
  "sandbox",
  "no encontrado",
  "pendiente",
];

/** Only operational messages written by us reach the shopper; anything else is generic. */
export function toPublicBoldError(message: string): { message: string; status: 400 | 500 } {
  const isPublic = PUBLIC_MESSAGE_MARKERS.some((marker) => message.includes(marker));
  return isPublic ? { message, status: 400 } : { message: "Error al preparar el pago.", status: 500 };
}
