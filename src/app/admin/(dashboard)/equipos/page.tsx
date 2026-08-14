import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  createTeamAction,
  updateTeamAction,
  deleteTeamAction,
} from "@/features/catalog/server/catalog-actions";

export const metadata: Metadata = {
  title: "Equipos · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: { liga?: string };
}) {
  const leagues = await prisma.league.findMany({ orderBy: { name: "asc" } });
  const filteredLeague = searchParams.liga
    ? leagues.find((l) => l.slug === searchParams.liga)?.id
    : undefined;

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    where: filteredLeague ? { leagueId: filteredLeague } : undefined,
    include: { league: { select: { name: true } }, _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Equipos <span className="text-muted-foreground">({teams.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea y edita equipos. No se puede eliminar un equipo que tenga productos.
        </p>
      </div>

      <form
        action={createTeamAction}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nuevo equipo
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            name="leagueId"
            required
            defaultValue={filteredLeague ?? ""}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-44"
          >
            <option value="" disabled>Liga…</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <input
            name="name"
            placeholder="Nombre (ej: Real Madrid)"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            name="shortName"
            placeholder="Abreviatura (ej: RMA)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-36"
          />
          <input
            name="country"
            placeholder="País"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-32"
          />
          <input
            name="crestUrl"
            placeholder="URL del escudo (opcional)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-56"
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
              <th className="px-4 py-3 font-medium">Equipo</th>
              <th className="px-4 py-3 font-medium">Liga</th>
              <th className="px-4 py-3 text-center font-medium">Productos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-medium">{team.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{team.league.name}</td>
                <td className="px-4 py-3 text-center tabular-nums">{team._count.products}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <form
                      action={updateTeamAction.bind(null, team.id)}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="leagueId"
                        defaultValue={team.leagueId}
                        className="h-7 w-32 rounded-md border border-input bg-background px-1.5 text-xs"
                      >
                        {leagues.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      <input
                        name="name"
                        defaultValue={team.name}
                        className="h-7 w-36 rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <input
                        name="shortName"
                        defaultValue={team.shortName ?? ""}
                        placeholder="Abrev."
                        className="h-7 w-16 rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <input
                        name="country"
                        defaultValue={team.country ?? ""}
                        placeholder="País"
                        className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <input
                        name="crestUrl"
                        defaultValue={team.crestUrl ?? ""}
                        placeholder="Escudo URL"
                        className="hidden"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                      >
                        Guardar
                      </button>
                    </form>
                    <form action={deleteTeamAction.bind(null, team.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Eliminar
                      </button>
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