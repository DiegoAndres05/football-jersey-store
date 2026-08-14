import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  createSizeAction,
  updateSizeAction,
  deleteSizeAction,
} from "@/features/catalog/server/catalog-actions";

export const metadata: Metadata = {
  title: "Tallas · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSizesPage() {
  const sizes = await prisma.size.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { variants: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Tallas <span className="text-muted-foreground">({sizes.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          No se puede eliminar una talla que esté en uso por variantes.
        </p>
      </div>

      <form action={createSizeAction} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nueva talla</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input name="code" placeholder="Código (ej: S)" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-32" />
          <input name="name" placeholder="Nombre (ej: S — Pequeña)" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64" />
          <input name="position" type="number" min={0} defaultValue={0} placeholder="Orden" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-24" />
          <button type="submit" className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]">Crear</button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 text-center font-medium">Orden</th>
              <th className="px-4 py-3 text-center font-medium">Variantes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sizes.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-b-0 align-top">
                <td className="px-4 py-3 font-medium">
                  <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{s.code}</code>
                </td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-center tabular-nums">{s.position}</td>
                <td className="px-4 py-3 text-center tabular-nums">{s._count.variants}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <form action={updateSizeAction.bind(null, s.id)} className="flex items-center gap-2">
                      <input name="code" defaultValue={s.code} className="h-7 w-14 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="name" defaultValue={s.name} className="h-7 w-32 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="position" type="number" min={0} defaultValue={s.position} className="h-7 w-14 rounded-md border border-input bg-background px-2 text-xs" />
                      <button type="submit" className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors">Guardar</button>
                    </form>
                    <form action={deleteSizeAction.bind(null, s.id)}>
                      <button type="submit" className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors">Eliminar</button>
                    </form>
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