import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImageIcon, ArrowRight } from "lucide-react";
import {
  createProductAction,
  updateProductAction,
} from "@/features/catalog/server/catalog-actions";
import { ProductDeleteButton } from "@/features/catalog/components/product-delete-button";
import { KIT_TYPES } from "@/features/catalog/types/kit-types";
import { getTeams, getSeasons } from "@/features/catalog/server/reference-cache";

export const metadata: Metadata = {
  title: "Productos · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const [products, teams, seasons] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        team: { select: { name: true, league: { select: { name: true } } } },
        _count: { select: { images: true, variants: true, supplierProducts: true } },
      },
    }),
    getTeams(),
    getSeasons(),
  ]);

  const productInputs = (p: (typeof products)[number]) => (
    <>
      <input name="name" defaultValue={p.name} required className="h-7 w-40 rounded-md border border-input bg-background px-2 text-xs" />
      <input name="shortName" defaultValue={p.shortName ?? ""} placeholder="Abrev." className="h-7 w-16 rounded-md border border-input bg-background px-2 text-xs" />
      <select name="teamId" defaultValue={p.teamId} className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-xs">
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <select name="seasonId" defaultValue={p.seasonId} className="h-7 w-28 rounded-md border border-input bg-background px-1.5 text-xs">
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>{s.year ?? s.name}</option>
        ))}
      </select>
      <select name="kitType" defaultValue={p.kitType} className="h-7 w-28 rounded-md border border-input bg-background px-1.5 text-xs">
        {KIT_TYPES.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <input name="brand" defaultValue={p.brand ?? ""} placeholder="Marca" className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs" />
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <input type="checkbox" name="isFeatured" defaultChecked={p.isFeatured} className="accent-primary" /> Destacado
      </label>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <input type="checkbox" name="isActive" defaultChecked={p.isActive} className="accent-primary" /> Activo
      </label>
      <input name="customizationSurcharge" type="number" min={0} defaultValue={p.customizationSurcharge} className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs" title="Recargo personalización (COP)" />
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <input type="checkbox" name="customizationsEnabled" defaultChecked={p.customizationsEnabled} className="accent-primary" /> Personal.
      </label>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <input type="checkbox" name="hasPlayerPrint" defaultChecked={p.hasPlayerPrint} className="accent-primary" /> Dorsal
      </label>
      <input name="description" defaultValue={p.description ?? ""} placeholder="Descripción" className="hidden" />
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Productos <span className="text-muted-foreground">({products.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea y edita productos. No se puede eliminar un producto con variantes, proveedores o imágenes.
        </p>
      </div>

      <form
        action={createProductAction}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nuevo producto
        </p>
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            name="name"
            placeholder="Nombre (ej: Real Madrid 25/26 Local)"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <select
            name="teamId"
            required
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-44"
          >
            <option value="" disabled>Equipo…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            name="seasonId"
            required
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36"
          >
            <option value="" disabled>Temporada…</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.year ?? s.name}</option>
            ))}
          </select>
          <select name="kitType" defaultValue="LOCAL" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36">
            {KIT_TYPES.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            name="brand"
            placeholder="Marca (ej: Adidas)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]"
          >
            Crear
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Equipo / Liga</th>
              <th className="px-4 py-3 text-center font-medium">Imágenes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-b-0 align-top">
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {p._count.variants} variante(s) · {p._count.supplierProducts} proveedor(es)
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.team.name}
                  {p.team.league ? ` · ${p.team.league.name}` : ""}
                </td>
                <td className="px-4 py-3 text-center tabular-nums">{p._count.images}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <form action={updateProductAction.bind(null, p.id)} className="flex flex-wrap items-center gap-2">
                      {productInputs(p)}
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                      >
                        Guardar
                      </button>
                    </form>
                    <Link
                      href={`/admin/productos/${p.slug}/imagenes`}
                      className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                    >
                      <ImageIcon className="mr-1 h-3 w-3" /> Imágenes
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                    <Link
                      href={`/admin/productos/${p.slug}/variantes`}
                      className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                    >
                      Variantes
                    </Link>
                    <ProductDeleteButton
                      productId={p.id}
                      productName={p.name}
                      counts={{
                        variants: p._count.variants,
                        suppliers: p._count.supplierProducts,
                        images: p._count.images,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}