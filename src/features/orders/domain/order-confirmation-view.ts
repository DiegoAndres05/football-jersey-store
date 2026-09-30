export type OrderConfirmationView = "paid" | "failed" | "cancelled" | "pending";

const PAID_STATUSES = new Set([
  "PAID",
  "VALIDATING",
  "RESERVED",
  "SUPPLIER_REQUESTED",
  "IN_TRANSIT",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
]);
const CANCELLED_STATUSES = new Set(["CANCELLED", "REFUNDED", "RETURNED"]);

/** The persisted Order status is the only source of truth for the confirmation UI. */
export function orderConfirmationView(status: string): OrderConfirmationView {
  if (PAID_STATUSES.has(status)) return "paid";
  if (status === "PAYMENT_FAILED") return "failed";
  if (CANCELLED_STATUSES.has(status)) return "cancelled";
  return "pending";
}

/** Only a pending order that just came back from Bold asks the server to reconcile. */
export function shouldReconcileOnConfirmation(view: OrderConfirmationView, returnedFromBold: boolean): boolean {
  return view === "pending" && returnedFromBold;
}

export const ORDER_CONFIRMATION_COPY: Record<
  OrderConfirmationView,
  { title: string; statusLabel: string; banner: string }
> = {
  paid: {
    title: "Pago aprobado",
    statusLabel: "Pago aprobado",
    banner: "Pago confirmado. Tu pedido está siendo preparado para envío.",
  },
  failed: {
    title: "Pago rechazado",
    statusLabel: "Pago rechazado",
    banner: "El pago no fue procesado. Por favor, intenta de nuevo desde la tienda.",
  },
  cancelled: {
    title: "Orden cancelada",
    statusLabel: "Cancelada",
    banner: "Esta orden fue cancelada y no se realizará ningún cobro adicional.",
  },
  pending: {
    title: "Pedido recibido",
    statusLabel: "Confirmando pago",
    banner: "Estamos confirmando tu pago.",
  },
};
