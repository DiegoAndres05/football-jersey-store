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
  const address = [
    order.shipping.line1,
    order.shipping.line2?.trim() || null,
    [order.shipping.city, order.shipping.state].filter(Boolean).join(", "),
    order.shipping.zipCode?.trim() ? `CP ${order.shipping.zipCode.trim()}` : null,
    order.shipping.country,
  ].filter(Boolean);
  return [
    `Nueva compra ${order.orderCode}`,
    `Fecha: ${order.createdAt.toISOString()}`,
    `Cliente: ${order.customer.name}${order.customer.email ? ` (${order.customer.email})` : ""}`,
    order.customer.phone ? `Teléfono cliente: ${order.customer.phone}` : null,
    `Quién recibe: ${order.shipping.recipient}`,
    `Teléfono entrega: ${order.shipping.phone}`,
    "Dirección:",
    ...address.map((part) => `- ${part}`),
    order.shipping.notes?.trim() ? `Notas: ${order.shipping.notes.trim()}` : null,
    `Total: ${formatPrice(order.total)}`,
    `Estado: ${order.status}`,
    "Productos:",
    lines,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n");
}
