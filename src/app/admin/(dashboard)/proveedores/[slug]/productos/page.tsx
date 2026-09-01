import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  addSupplierProductAction,
  updateSupplierProductAction,
  removeSupplierProductAction,
} from "@/features/catalog/server/catalog-actions";

export const metadata: Metadata = {
  title: "Productos por proveedor · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSupplierProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { slug },
    include: {
      products: {
        include: { product: { select: { name: true, team: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!supplier) notFound();

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const assigned = new Set(supplier.products.map((sp) => sp.productId));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/proveedores"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Volver a proveedores
        </Link>
        <h2 className="mt-1 font-display text-lg font-bold uppercase tracking-tight">
          Productos · {supplier.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Asigna qué productos compra a este proveedor y su costo.
        </p>
      </div>

      <form
        action={addSupplierProductAction.bind(null, supplier.id)}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Asignar producto
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select name="productId" required defaultValue="" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="" disabled>Producto…</option>
            {products
              .filter((p) => !assigned.has(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
          </select>
          <input
            name="costPrice"
            type="number"
            min={0}
            placeholder="Costo (COP)"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-40"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]"
          >
            Asignar
          </button>
        </div>
      </form>

      {supplier.products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Sin productos asignados todavía.
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Equipo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {supplier.products.map((sp) => (
                <tr key={sp.id} className="border-b border-border last:border-b-0 align-top">
                  <td className="px-4 py-3 font-medium">{sp.product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sp.product.team.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={updateSupplierProductAction.bind(null, sp.id)} className="flex items-center gap-2">
                        <input
                          name="costPrice"
                          type="number"
                          min={0}
                          defaultValue={sp.costPrice}
                          className="h-7 w-28 rounded-md border border-input bg-background px-2 text-xs"
                          title="Costo (COP)"
                        />
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input type="checkbox" name="isAvailable" defaultChecked={sp.isAvailable} className="accent-primary" /> Disponible
                        </label>
                        <button type="submit" className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors">
                          Guardar
                        </button>
                      </form>
                      <form action={removeSupplierProductAction.bind(null, sp.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Quitar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}