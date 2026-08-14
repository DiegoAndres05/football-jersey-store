import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
  adjustStockAction,
} from "@/features/catalog/server/catalog-actions";

export const metadata: Metadata = {
  title: "Variantes · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductVariantsPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      team: { select: { name: true } },
      variants: { include: { version: true, size: true }, orderBy: [{ size: { position: "asc" } }, { version: { name: "asc" } }] },
    },
  });
  if (!product) notFound();

  const [versions, sizes] = await Promise.all([
    prisma.version.findMany({ orderBy: { name: "asc" } }),
    prisma.size.findMany({ orderBy: { position: "asc" } }),
  ]);

  const movements = await prisma.inventoryMovement.groupBy({
    by: ["variantId"],
    where: { variantId: { in: product.variants.map((v) => v.id) } },
    _sum: { quantity: true },
  });
  const stockByVariant = new Map(movements.map((m) => [m.variantId, m._sum.quantity ?? 0]));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Volver a productos
        </Link>
        <h2 className="mt-1 font-display text-lg font-bold uppercase tracking-tight">
          Variantes · {product.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {product.team.name} · el stock se calcula como la suma del ledger de inventario.
        </p>
      </div>

      <form
        action={createVariantAction.bind(null, product.id)}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nueva variante
        </p>
        <div className="flex flex-col lg:flex-row gap-3">
          <select name="versionId" required defaultValue="" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-40">
            <option value="" disabled>Versión…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <select name="sizeId" required defaultValue="" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-32">
            <option value="" disabled>Talla…</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input name="costPrice" type="number" min={0} placeholder="Costo (COP)" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-32" />
          <input name="salePrice" type="number" min={1} placeholder="Precio venta (COP)" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36" />
          <input name="compareAtPrice" type="number" min={0} placeholder="Precio tachado" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-32" />
          <input name="lowStockAt" type="number" min={0} placeholder="Alerta stock ≤" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-28" />
          <button type="submit" className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]">
            Crear
          </button>
        </div>
      </form>

      {product.variants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Este producto no tiene variantes todavía.
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Talla</th>
                <th className="px-4 py-3 font-medium">Versión</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 text-center font-medium">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => {
                const stock = stockByVariant.get(v.id) ?? 0;
                const low = v.lowStockAt !== null && stock <= v.lowStockAt;
                return (
                  <tr key={v.id} className="border-b border-border last:border-b-0 align-top">
                    <td className="px-4 py-3 font-medium">{v.size.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.version.name}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{v.sku}</code>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`tabular-nums font-semibold ${low ? "text-destructive" : ""}`}>{stock}</span>
                      {v.lowStockAt !== null && (
                        <span className="block text-xs text-muted-foreground">alerta ≤ {v.lowStockAt}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <form action={updateVariantAction.bind(null, v.id)} className="flex flex-wrap items-center gap-2">
                          <input name="costPrice" type="number" min={0} defaultValue={v.costPrice} className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs" title="Costo" />
                          <input name="salePrice" type="number" min={1} defaultValue={v.salePrice} className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs" title="Venta" />
                          <input name="compareAtPrice" type="number" min={0} defaultValue={v.compareAtPrice ?? ""} placeholder="Tachado" className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs" />
                          <input name="lowStockAt" type="number" min={0} defaultValue={v.lowStockAt ?? ""} placeholder="Alert.≤" className="h-7 w-16 rounded-md border border-input bg-background px-2 text-xs" />
                          <input name="weight" type="number" min={1} defaultValue={v.weight} className="h-7 w-14 rounded-md border border-input bg-background px-2 text-xs" title="Peso (g)" />
                          <button type="submit" className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors">
                            Guardar
                          </button>
                        </form>
                        <form action={adjustStockAction.bind(null, v.id)} className="flex items-center gap-2">
                          <input name="quantity" type="number" required placeholder="±cantidad" className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs" />
                          <input name="reason" placeholder="Motivo" className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs" />
                          <button type="submit" className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors">
                            Ajustar
                          </button>
                        </form>
                        <form action={deleteVariantAction.bind(null, v.id)}>
                          <button type="submit" className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}