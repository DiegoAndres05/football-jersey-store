import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusSelect } from "@/features/orders/components/order-status-select";

const STATUS_TONE: Record<string, string> = {
  PENDING_PAYMENT: "bg-secondary text-muted-foreground",
  PAID: "bg-emerald-100 text-emerald-800",
  VALIDATING: "bg-secondary text-muted-foreground",
  PREPARING: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-destructive/10 text-destructive",
};

export default async function AdminDashboardPage() {
  const [totalOrders, pendingCount, paidCount, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { items: true },
    }),
  ]);

  const stats = [
    { label: "Pedidos totales", value: totalOrders },
    { label: "Pendientes de pago", value: pendingCount },
    { label: "Pagados", value: paidCount },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Pedidos recientes
          </h2>
          <span className="text-xs text-muted-foreground">Últimos {recentOrders.length}</span>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Todavía no hay pedidos registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3">Código</th>
                  <th className="pb-2 pr-3">Fecha</th>
                  <th className="pb-2 pr-3">Cliente</th>
                  <th className="pb-2 pr-3 text-right">Total</th>
                  <th className="pb-2 pr-3">Estado</th>
                  <th className="pb-2">Cambiar estado</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3">
                      <Link
                        href={`/pedido/confirmado/${order.code}`}
                        className="font-mono text-xs font-medium hover:underline"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-medium truncate max-w-40">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-40">
                        {order.customerEmail} · {order.items.length}{" "}
                        {order.items.length === 1 ? "artículo" : "artículos"}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-right font-medium tabular-nums">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_TONE[order.status] ?? "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <OrderStatusSelect orderId={order.id} status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}