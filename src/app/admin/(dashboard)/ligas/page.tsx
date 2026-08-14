import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Trophy } from "lucide-react";
import {
  createLeagueAction,
  updateLeagueAction,
  deleteLeagueAction,
} from "@/features/catalog/server/catalog-actions";

export const metadata: Metadata = {
  title: "Ligas · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLeaguesPage() {
  const leagues = await prisma.league.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { teams: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Ligas <span className="text-muted-foreground">({leagues.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea y edita ligas. No se puede eliminar una liga que tenga equipos.
        </p>
      </div>

      <form
        action={createLeagueAction}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nueva liga
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            name="name"
            placeholder="Nombre (ej: LaLiga EA Sports)"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            name="country"
            placeholder="País (ej: España)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-44"
          />
          <input
            name="logoUrl"
            placeholder="URL del logo (opcional)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64"
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
              <th className="px-4 py-3 font-medium">Liga</th>
              <th className="px-4 py-3 font-medium">País</th>
              <th className="px-4 py-3 text-center font-medium">Equipos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {leagues.map((league) => (
              <tr key={league.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    {league.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={league.logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    )}
                    {league.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{league.country ?? "—"}</td>
                <td className="px-4 py-3 text-center tabular-nums">{league._count.teams}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <form
                      action={updateLeagueAction.bind(null, league.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={league.name}
                        className="h-7 w-36 rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <input
                        name="country"
                        defaultValue={league.country ?? ""}
                        placeholder="País"
                        className="h-7 w-28 rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <input
                        name="logoUrl"
                        defaultValue={league.logoUrl ?? ""}
                        placeholder="Logo URL"
                        className="hidden"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                      >
                        Guardar
                      </button>
                    </form>
                    <form action={deleteLeagueAction.bind(null, league.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Eliminar
                      </button>
                    </form>
                    <Link
                      href={`/admin/equipos?liga=${league.slug}`}
                      className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                    >
                      Equipos <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
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