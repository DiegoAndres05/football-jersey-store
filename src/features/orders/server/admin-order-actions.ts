"use server";

import { getSessionUser } from "@/features/auth/server/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminOrder } from "../repositories/admin-order-repository";
import { notifyOrderPaid } from "@/features/notifications/services/notification-service";

const retryInput = z.object({ orderId: z.string().min(1) });

export async function retryOrderNotification(input: { orderId: string } | string, _formData?: FormData) {
  const admin = await getSessionUser();
  if (!admin) throw new Error("No autorizado.");
  const parsed = retryInput.safeParse(typeof input === "string" ? { orderId: input } : input);
  if (!parsed.success) throw new Error("Solicitud inválida.");
  const order = await getAdminOrder(parsed.data.orderId);
  if (!order) throw new Error("Pedido no encontrado.");
  const result = await notifyOrderPaid(order.id);
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${order.id}`);
  return result;
}