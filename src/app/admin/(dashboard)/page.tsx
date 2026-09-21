import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, AlertTriangle } from "lucide-react";
import { AdminEmptyState } from "./admin-page-states";
import { getAdminDashboardSummary } from "@/features/orders/repositories/admin-dashboard-repository";
import { formatAdminCurrency, formatAdminShortCurrency, stockStatusLabel } from "./admin-ui-formatters";

export default async function AdminDashboardPage() {
  const summary = await getAdminDashboardSummary();

  const statCards = [
    { label: "Ingresos últimos 30 días", value: formatAdminShortCurrency(summary.paidRevenueLast30Days), tone: "emerald" },
    { label: "Pedidos últimos 30 días", value: String(summary.ordersLast30Days), tone: "neutral" },
    { label: "Pagos pendientes", value: String(summary.pendingPayments), tone: summary.pendingPayments > 0 ? "amber" : "neutral" },
    { label: "Productos activos", value: String(summary.activeProducts), tone: "neutral" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Panel</h2>
        <p className="text-sm text-muted-foreground">Últimos 30 días · resumen operativo e inventario actual.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl border border-border bg-card p-5 ${card.tone === "amber" ? "border-amber-300 bg-amber-50/50" : ""}`}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${card.tone === "emerald" ? "text-emerald-700" : ""}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <h3 className="font-display text-base font-bold uppercase tracking-tight">Alertas de inventario</h3>
          </div>
          <Link href="/admin/inventario" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline">
            Ver inventario <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        {summary.alerts.length === 0 ? (
          <AdminEmptyState title="Sin alertas" description="No hay variantes bajo umbral ni agotadas en el estado actual del inventario." actionLabel="Ir a inventario" actionHref="/admin/inventario" />
        ) : (
          <div className="space-y-3">
            {summary.alerts.map((alert) => (
              <div key={alert.variantId} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{alert.productName}</p>
                  <p className="text-xs text-muted-foreground">{alert.versionName} · {alert.sizeName} · <span className="font-mono">{alert.sku}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-semibold">{alert.stock}</span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">{stockStatusLabel(alert.status as any)}</span>
                  <Link href={`/admin/productos/${alert.productSlug}/variantes`} className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline">
                    Abrir variante <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <h3 className="font-display text-base font-bold uppercase tracking-tight">Pedidos recientes</h3>
          </div>
          <Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline">
            Ver todos <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5" aria-hidden="true" />
          Alcance: pedidos con fecha dentro de los últimos 30 días.
        </div>
      </section>
    </div>
  );
}
