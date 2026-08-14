import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice, formatPriceShort } from "@/lib/utils";
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

const PAID_STATUSES = ["PAID", "VALIDATING", "PREPARING", "SHIPPED", "DELIVERED"] as const;

export default async function AdminDashboardPage() {
  const [
    totalOrders,
    pendingCount,
    paidCount,
    paidAgg,
    recentOrders,
    negativeStockRows,
    activeProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({
      where: { status: { in: [...PAID_STATUSES] } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { items: true },
    }),
    // variantes con existencias negativas o cero + umbral configurado
    prisma.$queryRaw`SELECT v.id AS "variantId",
        COALESCE(SUM(m.quantity), 0)::int AS stock,
        v."lowStockAt" AS "lowStockAt",
        v.sku AS sku,
        pr.slug AS "productSlug", pr.name AS "productName",
        sz.name AS "sizeName", ve.name AS "versionName"
      FROM "ProductVariant" v
      JOIN "Product" pr ON pr.id = v."productId"
      JOIN "Size" sz ON sz.id = v."sizeId"
      JOIN "Version" ve ON ve.id = v."versionId"
      LEFT JOIN "InventoryMovement" m ON m."variantId" = v.id
      WHERE v."lowStockAt" IS NOT NULL
      GROUP BY v.id, pr.slug, pr.name, sz.name, ve.name
      HAVING COALESCE(SUM(m.quantity), 0) <= v."lowStockAt"
      ORDER BY stock ASC
      LIMIT 10`,
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count(),
  ]);

  const lowStock = (negativeStockRows as { variantId: string; stock: number; lowStockAt: number | null; sku: string; productSlug: string; productName: string; sizeName: string; versionName: string }[]).map((r) => ({
    ...r,
    outOfStock: r.stock <= 0,
  }));

  const revenue = paidAgg._sum.total ?? 0;

  const stats = [
    { label: "Ingresos (pedidos pagados)", value: formatPriceShort(revenue), highlight: true },
    { label: "Pedidos totales", value: totalOrders },
    { label: "Pendientes de pago", value: pendingCount, warn: pendingCount > 0 },
    { label: "Productos activos", value: activeProducts },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border border-border bg-card p-5 ${s.warn ? "border-amber-300 bg-amber-50/50" : ""}`}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${s.highlight ? "text-emerald-700" : ""}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Stock bajo
          </h2>
          {lowStock.length === 0 && (
            <span className="text-xs text-muted-foreground">Sin alertas</span>
          )}
        </div>

        {lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Ninguna variante está en su umbral de stock bajo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3">Producto</th>
                  <th className="pb-2 pr-3">Talla / Versión</th>
                  <th className="pb-2 pr-3">SKU</th>
                  <th className="pb-2 pr-3 text-right">Stock</th>
                  <th className="pb-2 pr-3 text-right">Umbral</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((v) => (
                  <tr key={v.variantId} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3">
                      <Link href={`/admin/productos/${v.productSlug}/variantes`} className="font-medium hover:underline">
                        {v.productName}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {v.sizeName} · {v.versionName}
                    </td>
                    <td className="py-3 pr-3">
                      <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{v.sku}</code>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums font-semibold">{v.stock}</td>
                    <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">{v.lowStockAt}</td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          v.outOfStock ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {v.outOfStock ? "Sin existencias" : "Stock bajo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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