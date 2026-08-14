import { prisma } from "@/lib/prisma";

export default async function AdminInventoryPage() {
  const [variants, movements] = await Promise.all([
    prisma.productVariant.findMany({
      include: {
        product: { select: { name: true, slug: true, team: { select: { name: true } } } },
        version: { select: { name: true } },
        size: { select: { code: true } },
      },
      orderBy: [{ product: { name: "asc" } }, { size: { position: "asc" } }],
    }),
    prisma.inventoryMovement.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
    }),
  ]);

  const stockByVariant = new Map(movements.map((m) => [m.variantId, m._sum.quantity ?? 0]));

  const rows = variants.map((v) => {
    const stock = stockByVariant.get(v.id) ?? 0;
    const lowStockAt = v.lowStockAt ?? 2;
    return {
      id: v.id,
      sku: v.sku,
      productName: v.product.name,
      teamName: v.product.team.name,
      versionName: v.version.name,
      sizeCode: v.size.code,
      stock,
      isLow: stock > 0 && stock <= lowStockAt,
      isOut: stock <= 0,
    };
  });

  const lowCount = rows.filter((r) => r.isLow).length;
  const outCount = rows.filter((r) => r.isOut).length;

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
                <tr
                  key={r.id}
                  className={`border-b border-border/60 last:border-0 ${
                    r.isLow || r.isOut ? "bg-amber-50/60" : ""
                  }`}
                >
                  <td className="py-2.5 pr-3 font-medium">{r.productName}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{r.teamName}</td>
                  <td className="py-2.5 pr-3">{r.versionName}</td>
                  <td className="py-2.5 pr-3">{r.sizeCode}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{r.sku}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{r.stock}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.isOut
                          ? "bg-destructive/10 text-destructive"
                          : r.isLow
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {r.isOut ? "Agotada" : r.isLow ? "Stock bajo" : "Disponible"}
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