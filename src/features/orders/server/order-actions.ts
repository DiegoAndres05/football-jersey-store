"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/server/session";
import {
  createOrder,
  type CreateOrderInput,
} from "@/features/orders/repositories/order-repository";
import { prepareBoldTransaction } from "@/features/payments/services/bold-service";
import { toPublicBoldError } from "@/features/payments/domain/bold-public-error";

export type BoldCheckoutPayload = {
  orderId: string;
  amount: string;
  currency: string;
  hash: string;
  apiKey: string;
};

export async function submitOrder(input: CreateOrderInput) {
  const result = await createOrder(input);
  if (!result.ok) return result;
  try {
    const payment = await prepareBoldTransaction(result.code);
    const bold: BoldCheckoutPayload = {
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      hash: payment.hash,
      apiKey: payment.apiKey,
    };
    return { ...result, bold, boldError: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    console.error("Error preparing Bold payment:", message);
    return { ...result, bold: null, boldError: toPublicBoldError(message).message };
  }
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