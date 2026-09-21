import Link from "next/link";
import { getAdminInventoryProjection } from "@/features/inventory/server/admin-inventory-projection";
import { stockStatusLabel } from "../admin-ui-formatters";

export default async function AdminInventoryPage() {
  const rows = await getAdminInventoryProjection();

  const lowCount = rows.filter((r) => r.status === "STOCK_BAJO").length;
  const outCount = rows.filter((r) => r.status === "AGOTADO").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Variantes</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Stock bajo</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-amber-600">{lowCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Agotadas</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-destructive">{outCount}</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">Inventario</h2>
          <span className="text-xs text-muted-foreground">
            El stock se calcula de los movimientos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3">Producto</th>
                <th className="pb-2 pr-3">Equipo</th>
                <th className="pb-2 pr-3">Versión</th>
                <th className="pb-2 pr-3">Talla</th>
                <th className="pb-2 pr-3">SKU</th>
                <th className="pb-2 pr-3 text-right">Stock</th>
                <th className="pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.variantId} className={`border-b border-border/60 last:border-0 ${r.status !== "DISPONIBLE" ? "bg-amber-50/60" : ""}`}>
                  <td className="py-2.5 pr-3 font-medium"><Link href={`/admin/productos/${r.productSlug}/variantes`} className="hover:underline">{r.productName}</Link></td>
                  <td className="py-2.5 pr-3 text-muted-foreground">—</td>
                  <td className="py-2.5 pr-3">{r.versionName}</td>
                  <td className="py-2.5 pr-3">{r.sizeName}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{r.sku}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{r.stock}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.status === "AGOTADO"
                          ? "bg-destructive/10 text-destructive"
                          : r.status === "STOCK_BAJO"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {stockStatusLabel(r.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}