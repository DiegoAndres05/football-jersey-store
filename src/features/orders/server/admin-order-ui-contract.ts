import { z } from "zod";

export const adminRetryInputSchema = z.object({
  orderId: z.string().trim().min(1, "Pedido requerido."),
});

export type AdminRetryInput = z.infer<typeof adminRetryInputSchema>;

export type AdminOrderReadState =
  | { status: "loaded"; orderId: string }
  | { status: "not-found"; message: string; actionLabel: string; href: string }
  | { status: "incomplete"; message: string; actionLabel: string; href: string }
  | { status: "read-error"; message: string; actionLabel: string; href: string };

export function createAdminOrderReadState(
  order: { id: string } | null,
  error?: unknown,
): AdminOrderReadState {
  if (order) return { status: "loaded", orderId: order.id };
  if (error instanceof Error && error.message.includes("Pedido")) {
    return { status: "read-error", message: "No pudimos cargar el pedido en este momento. Intenta de nuevo.", actionLabel: "Volver a pedidos", href: "/admin/pedidos" };
  }
  return { status: "not-found", message: "No encontramos este pedido o ya no está disponible.", actionLabel: "Volver a pedidos", href: "/admin/pedidos" };
}
