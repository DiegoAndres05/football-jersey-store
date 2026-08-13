import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { getLeagues, getTeamsByLeague } from "@/features/products/repositories/product-repository";

export const metadata = {
  title: "Ligas",
};

export default async function LigasPage() {
  const leagues = await getLeagues();
  const teamsByLeague = await Promise.all(
    leagues.map((l) => getTeamsByLeague(l.slug)),
  );

  return (
    <div className="container-page py-8 md:py-12 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Ligas</span>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Competiciones
      </p>
      <h1 className="mt-2 font-display text-5xl md:text-6xl font-bold uppercase tracking-tight">
        Ligas
      </h1>
      <p className="mt-4 text-muted-foreground max-w-xl leading-relaxed">
        Camisetas de los equipos y selecciones de las principales competiciones del mundo.
      </p>

      <div className="mt-12 space-y-10">
        {leagues.map((league, i) => {
          const teams = teamsByLeague[i] ?? [];
          return (
            <section key={league.slug} className="border-b border-border pb-10 last:border-b-0">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
                  <span className="text-muted-foreground mr-3 text-base font-semibold tracking-widest">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {league.name}
                </h2>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {league.country}
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {league.productCount > 0
                  ? `${league.productCount} producto${league.productCount !== 1 ? "s" : ""} disponible${league.productCount !== 1 ? "s" : ""}`
                  : "Próximamente"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {teams.map((team) => (
                  <Link
                    key={team.slug}
                    href={`/productos?liga=${league.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-foreground hover:bg-accent transition-colors"
                  >
                    {team.name}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}