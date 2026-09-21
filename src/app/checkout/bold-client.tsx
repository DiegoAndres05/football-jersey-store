"use client";

/** Public, non-sensitive state returned by Bold's SDK/redirect. */
export type BoldClientStatus =
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "PENDING"
  | "UNKNOWN";

export function normalizeBoldClientStatus(value: unknown): BoldClientStatus {
  const status = String(value ?? "").trim().toUpperCase();
  if (status === "APPROVED" || status === "SUCCESS" || status === "SALE_APPROVED") return "APPROVED";
  if (status === "REJECTED" || status === "FAILED" || status === "SALE_REJECTED") return "REJECTED";
  if (status === "CANCELLED" || status === "CANCELED") return "CANCELLED";
  if (status === "PENDING" || status === "PROCESSING") return "PENDING";
  return "UNKNOWN";
}

export function boldStatusMessage(status: BoldClientStatus): string {
  switch (status) {
    case "APPROVED": return "Pago recibido. Estamos confirmándolo.";
    case "REJECTED": return "Bold rechazó el pago. Puedes intentarlo de nuevo.";
    case "CANCELLED": return "Cancelaste el pago. Tu pedido y carrito siguen recuperables.";
    case "PENDING": return "El pago está pendiente de confirmación.";
    default: return "No pudimos verificar el resultado del pago.";
  }
}
