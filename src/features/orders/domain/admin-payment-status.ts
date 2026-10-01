import { orderConfirmationView } from "./order-confirmation-view";

export type AdminPaymentStatus = "paid" | "pending" | "failed" | "refunded" | "cancelled_unpaid";

/** Derived only from persisted Order fields, never from Bold or client data. */
export function adminPaymentStatus(order: { status: string; paidAt: Date | null }): AdminPaymentStatus {
  if (order.status === "REFUNDED") return "refunded";
  const view = orderConfirmationView(order.status);
  if (view === "paid") return "paid";
  if (view === "failed") return "failed";
  if (view === "cancelled") return order.paidAt ? "paid" : "cancelled_unpaid";
  return "pending";
}

export const ADMIN_PAYMENT_STATUS_BADGE: Record<AdminPaymentStatus, { label: string; className: string }> = {
  paid: { label: "Pagado", className: "bg-green-100 text-green-800" },
  pending: { label: "Pendiente de pago", className: "bg-amber-100 text-amber-900" },
  failed: { label: "Rechazado", className: "bg-red-100 text-red-800" },
  refunded: { label: "Reembolsado", className: "bg-blue-100 text-blue-800" },
  cancelled_unpaid: { label: "Cancelado sin pago", className: "bg-secondary text-muted-foreground" },
};
