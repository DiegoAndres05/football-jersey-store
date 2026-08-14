import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  createSeasonAction,
  updateSeasonAction,
  deleteSeasonAction,
} from "@/features/catalog/server/catalog-actions";

export const metadata: Metadata = {
  title: "Temporadas · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSeasonsPage() {
  const seasons = await prisma.season.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Temporadas <span className="text-muted-foreground">({seasons.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          No se puede eliminar una temporada que tenga productos.
        </p>
      </div>

      <form action={createSeasonAction} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nueva temporada</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input name="name" placeholder="Nombre (ej: 25/26)" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64" />
          <input name="year" type="number" min={1900} max={2100} placeholder="Año (ej: 2025)" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-40" />
          <label className="flex items-center gap-1 text-sm text-muted-foreground">
            <input type="checkbox" name="isRetro" className="accent-primary" /> Retro
          </label>
          <button type="submit" className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]">
            Crear
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Temporada</th>
              <th className="px-4 py-3 text-center font-medium">Año</th>
              <th className="px-4 py-3 text-center font-medium">Productos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {seasons.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-b-0 align-top">
                <td className="px-4 py-3 font-medium">
                  {s.name}
                  {s.isRetro && (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Retro</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center tabular-nums">{s.year ?? "—"}</td>
                <td className="px-4 py-3 text-center tabular-nums">{s._count.products}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <form action={updateSeasonAction.bind(null, s.id)} className="flex items-center gap-2">
                      <input name="name" defaultValue={s.name} className="h-7 w-28 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="year" type="number" min={1900} max={2100} defaultValue={s.year ?? ""} placeholder="Año" className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs" />
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input type="checkbox" name="isRetro" defaultChecked={s.isRetro} className="accent-primary" /> Retro
                      </label>
                      <button type="submit" className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors">Guardar</button>
                    </form>
                    <form action={deleteSeasonAction.bind(null, s.id)}>
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