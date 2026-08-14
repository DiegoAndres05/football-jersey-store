import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  createVersionAction,
  updateVersionAction,
  deleteVersionAction,
} from "@/features/catalog/server/catalog-actions";

export const metadata: Metadata = {
  title: "Versiones · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminVersionsPage() {
  const versions = await prisma.version.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { variants: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Versiones <span className="text-muted-foreground">({versions.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          No se puede eliminar una versión que esté en uso por variantes.
        </p>
      </div>

      <form action={createVersionAction} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nueva versión</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input name="name" placeholder="Nombre (ej: Local)" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64" />
          <input name="priceAdjustment" type="number" min={0} defaultValue={0} placeholder="Ajuste precio (COP)" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-48" />
          <button type="submit" className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]">Crear</button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Versión</th>
              <th className="px-4 py-3 text-center font-medium">Ajuste precio</th>
              <th className="px-4 py-3 text-center font-medium">Variantes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-b-0 align-top">
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3 text-center tabular-nums">+{v.priceAdjustment.toLocaleString("es-CO")}</td>
                <td className="px-4 py-3 text-center tabular-nums">{v._count.variants}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <form action={updateVersionAction.bind(null, v.id)} className="flex items-center gap-2">
                      <input name="name" defaultValue={v.name} className="h-7 w-40 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="priceAdjustment" type="number" min={0} defaultValue={v.priceAdjustment} className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs" />
                      <button type="submit" className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors">Guardar</button>
                    </form>
                    <form action={deleteVersionAction.bind(null, v.id)}>
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