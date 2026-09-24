import Link from "next/link";
import { listAdminOrders } from "@/features/orders/repositories/admin-order-repository";
import { formatPrice } from "@/lib/utils";
import { normalizeAdminOrderDateFilter, normalizeAdminOrderFilter } from "./admin-order-filters";
import { AdminEmptyState } from "../admin-page-states";
import { getTelegramConfig } from "@/features/notifications/config/telegram-config";
import { OrderListControls } from "./order-list-controls";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ modalidad?: string; fecha?: string; mes?: string; desde?: string; hasta?: string }> }) {
  const params = await searchParams;
  const mode = normalizeAdminOrderFilter(params.modalidad);
  const dateFilter = normalizeAdminOrderDateFilter(params);
  const orders = await listAdminOrders(mode === "TODOS" ? undefined : mode, dateFilter);
  const telegramConfigured = Boolean(getTelegramConfig());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Pedidos</h2>
        <p className="text-sm text-muted-foreground">Consulta pedidos por modalidad, fecha y estado de notificación Telegram.</p>
      </div>

      <OrderListControls active={mode} dateFilter={dateFilter} />

      {orders.length === 0 ? (
        <AdminEmptyState title="Sin pedidos" description={mode === "TODOS" ? "No hay pedidos en el panel." : "No hay pedidos para este filtro."} actionLabel="Volver al panel" actionHref="/admin" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="p-3">Código</th>
                <th className="p-3">Fecha</th>
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
                    <Link
                      href={`/admin/pedidos/${order.id}${new URLSearchParams({
                        ...(mode === "TODOS" ? {} : { modalidad: mode }),
                        ...(params.fecha ? { fecha: params.fecha } : {}),
                        ...(params.mes ? { mes: params.mes } : {}),
                        ...(params.desde ? { desde: params.desde } : {}),
                        ...(params.hasta ? { hasta: params.hasta } : {}),
                      }).toString() ? `?${new URLSearchParams({
                        ...(mode === "TODOS" ? {} : { modalidad: mode }),
                        ...(params.fecha ? { fecha: params.fecha } : {}),
                        ...(params.mes ? { mes: params.mes } : {}),
                        ...(params.desde ? { desde: params.desde } : {}),
                        ...(params.hasta ? { hasta: params.hasta } : {}),
                      }).toString()}` : ""}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {order.code}
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}
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
