import { ADMIN_PAYMENT_STATUS_BADGE, adminPaymentStatus } from "@/features/orders/domain/admin-payment-status";

export function PaymentStatusBadge({ order }: { order: { status: string; paidAt: Date | null } }) {
  const badge = ADMIN_PAYMENT_STATUS_BADGE[adminPaymentStatus(order)];
  return <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>;
}
