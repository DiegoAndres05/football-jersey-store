import { formatPrice } from "@/lib/utils";
import type { NotificationEvent } from "../types/notification-types";

export function formatOrderNotification(order: NotificationEvent): string {
  const lines = order.lines
    .map((line) => {
      const variant = [line.variant, line.size].filter(Boolean).join(" / ");
      const mode = line.deliveryMode === "BAJO_PEDIDO" ? "Bajo pedido" : line.deliveryMode === "NO_DISPONIBLE" ? "No disponible" : "Entrega inmediata";
      return `- ${line.product}${variant ? ` (${variant})` : ""} x${line.quantity}: ${mode}`;
    })
    .join("\n");
  return [
    `Nueva compra ${order.orderCode}`,
    `Fecha: ${order.createdAt.toISOString()}`,
    `Cliente: ${order.customer.name}${order.customer.email ? ` (${order.customer.email})` : ""}`,
    `Total: ${formatPrice(order.total)}`,
    `Estado: ${order.status}`,
    "Modalidades:",
    lines,
  ].join("\n");
}