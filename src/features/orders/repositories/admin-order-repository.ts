import { prisma } from "@/lib/prisma";
import type { DeliverySummary } from "../types/admin-order-types";

export type AdminDeliveryMode = "INMEDIATA" | "BAJO_PEDIDO" | "NO_DISPONIBLE";

export function normalizeAdminDeliveryMode(value: unknown): AdminDeliveryMode {
  return value === "INMEDIATA" || value === "BAJO_PEDIDO" ? value : "NO_DISPONIBLE";
}

export function deriveDeliverySummary(items: { deliveryMode: unknown }[]): DeliverySummary {
  const modes = items.map((item) => normalizeAdminDeliveryMode(item.deliveryMode));
  const hasImmediate = modes.includes("INMEDIATA");
  const hasBackorder = modes.includes("BAJO_PEDIDO");
  return { hasImmediate, hasBackorder, isMixed: hasImmediate && hasBackorder };
}

export async function listAdminOrders(deliveryMode?: "INMEDIATA" | "BAJO_PEDIDO") {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true, notificationAttempts: true } });
  return orders
    .map((order) => ({ ...order, items: order.items.map((item) => ({ ...item, deliveryMode: normalizeAdminDeliveryMode(item.deliveryMode) })), deliverySummary: deriveDeliverySummary(order.items), notificationAttempt: order.notificationAttempts.find((a) => a.channel === "TELEGRAM" && a.eventKey === "ORDER_CREATED_PAID") ?? null }))
    .filter((order) => !deliveryMode || order.items.some((item) => item.deliveryMode === deliveryMode));
}

export async function getAdminOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, history: { orderBy: { createdAt: "desc" } }, notificationAttempts: true },
  });
  if (!order) return null;
  // Deliberately project snapshots from Order; never join the mutable Coupon row.
  return {
    ...order,
    couponSnapshot: order.couponCodeSnapshot
      ? {
          code: order.couponCodeSnapshot,
          discountType: order.couponDiscountTypeSnapshot,
          value: order.couponValueSnapshot,
          eligibleBase: order.couponEligibleBase,
          discountAmount: order.couponDiscountAmount ?? order.discountAmount,
          appliedAt: order.couponAppliedAt,
        }
      : null,
  };
}