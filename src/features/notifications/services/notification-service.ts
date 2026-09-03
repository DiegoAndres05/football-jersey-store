import "server-only";
import { prisma } from "@/lib/prisma";
import { createTelegramTransport } from "../telegram/telegram-adapter";
import { formatOrderNotification } from "./notification-formatter";
import { sendOrderNotification } from "../repositories/notification-attempt-repository";

export async function notifyOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { status: "FAILED" as const, error: "Pedido no encontrado." };
  const message = formatOrderNotification({
    orderId: order.id,
    orderCode: order.code,
    createdAt: order.createdAt,
    customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
    total: order.total,
    status: order.status,
    lines: order.items.map((item) => ({ product: item.productName, variant: item.versionName, size: item.sizeName, quantity: item.quantity, deliveryMode: item.deliveryMode === "BAJO_PEDIDO" ? "BAJO_PEDIDO" : item.deliveryMode === "NO_DISPONIBLE" ? "NO_DISPONIBLE" : "INMEDIATA" })),
  });
  return sendOrderNotification(order.id, createTelegramTransport(), message);
}

export async function getNotificationAttempt(orderId: string) {
  return prisma.notificationAttempt.findFirst({ where: { orderId, channel: "TELEGRAM", eventKey: "ORDER_CREATED_PAID" } });
}