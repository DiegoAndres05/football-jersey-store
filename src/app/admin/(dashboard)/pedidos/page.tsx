import Link from "next/link";
import { listAdminOrders } from "@/features/orders/repositories/admin-order-repository";
import { formatPrice } from "@/lib/utils";
import { normalizeAdminOrderFilter } from "./admin-order-filters";
import { AdminEmptyState } from "../admin-page-states";
import { getTelegramConfig } from "@/features/notifications/config/telegram-config";
import { OrderListControls } from "./order-list-controls";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ modalidad?: string }> }) {
  const params = await searchParams;
  const mode = normalizeAdminOrderFilter(params.modalidad);
  const orders = await listAdminOrders(mode === "TODOS" ? undefined : mode);
  const telegramConfigured = Boolean(getTelegramConfig());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Pedidos</h2>
        <p className="text-sm text-muted-foreground">Filtros por modalidad y estado de notificación Telegram.</p>
      </div>

      <OrderListControls active={mode} />

      {orders.length === 0 ? (
        <AdminEmptyState title="Sin pedidos" description={mode === "TODOS" ? "No hay pedidos en el panel." : "No hay pedidos para este filtro."} actionLabel="Volver al panel" actionHref="/admin" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="p-3">Código</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Modalidad</th>
                <th className="p-3">Total</th>
                {telegramConfigured && <th className="p-3">Aviso</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/pedidos/${order.id}${mode === "TODOS" ? "" : `?modalidad=${mode}`}`} className="font-mono text-xs hover:underline">
                      {order.code}
                    </Link>
                  </td>
                  <td className="p-3">
                    <p>{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {order.deliverySummary.hasImmediate && <span className="rounded-full bg-secondary px-2 py-1 text-xs">Entrega inmediata</span>}
                      {order.deliverySummary.hasBackorder && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs">Bajo pedido</span>}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{formatPrice(order.total)}</td>
                  {telegramConfigured && (
                    <td className="p-3 text-xs">
                      {order.notificationAttempt?.status === "SENT"
                        ? "Enviado"
                        : order.notificationAttempt?.status === "FAILED"
                          ? "Fallido"
                          : "Pendiente"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
