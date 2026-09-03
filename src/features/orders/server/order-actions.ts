"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/server/session";
import {
  createOrder,
  type CreateOrderInput,
} from "@/features/orders/repositories/order-repository";
import { notifyOrderPaid } from "@/features/notifications/services/notification-service";

export async function submitOrder(input: CreateOrderInput) {
  const result = await createOrder(input);
  if (result.ok) {
    const order = await prisma.order.findUnique({ where: { code: result.code }, select: { id: true } });
    if (order) {
      await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current || current.status !== "PENDING_PAYMENT") return;
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: current.status,
            toStatus: "PAID",
            createdBy: input.paymentReference,
            note: "Pago simulado confirmado.",
          },
        });
      });
      void notifyOrderPaid(order.id).catch(() => undefined);
    }
  }
  return result;
}

const MANAGED_STATUSES = [
  "PAID",
  "VALIDATING",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type ManagedOrderStatus = (typeof MANAGED_STATUSES)[number];

export async function updateOrderStatusAction(
  orderId: string,
  nextStatus: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const status = MANAGED_STATUSES.find((s) => s === nextStatus);
  if (!status) return { ok: false, error: "Estado no permitido." };

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("order not found");

      await tx.order.update({
        where: { id: orderId },
        data: { status, ...(status === "PAID" ? { paidAt: new Date() } : {}) },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: status,
          createdBy: admin.email,
          note: "Actualización desde el panel de administración.",
        },
      });
    });
    return { ok: true };
  } catch (err) {
    console.error("updateOrderStatusAction failed:", err);
    return { ok: false, error: "No se pudo actualizar el estado." };
  }
}