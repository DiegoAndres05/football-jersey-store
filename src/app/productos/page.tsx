import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getProducts,
  getLeagues,
  getSeasons,
  getVersions,
  getSizes,
  getTeamsByLeague,
} from "@/features/products/repositories/product-repository";
import { ProductGrid } from "@/features/products/components/product-grid";
import { ProductFilters } from "@/features/products/components/product-filters";
import { EmptyState } from "@/features/products/components/empty-state";
import { parseProductFiltersParams } from "@/features/products/schemas/product-filters-schema";
import type { ProductFilters as FilterParams } from "@/features/products/types/product-types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = parseProductFiltersParams(params);

  const filters: FilterParams = {
    league: raw.liga,
    team: raw.equipo,
    season: raw.temporada,
    version: raw.version,
    size: raw.talla,
    availability: raw.disponibilidad,
    search: raw.q,
    sort: raw.sort,
    page: raw.page ?? 1,
  };

  const [result, leagues, teams, seasons, versions, sizes] = await Promise.all([
    getProducts(filters),
    getLeagues(),
    filters.league ? getTeamsByLeague(filters.league) : Promise.resolve([]),
    getSeasons(),
    getVersions(),
    getSizes(),
  ]);

  const activeFilters = buildActiveFilters(raw, {
    league: new Map(leagues.map((l) => [l.slug, l.name])),
    team: new Map(teams.map((t) => [t.slug, t.name])),
    season: new Map(seasons.map((s) => [s.slug, s.name])),
    version: new Map(versions.map((v) => [v.slug, v.name])),
  });
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="container-page py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Catálogo</span>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight">Filtros</h2>
            <ProductFilters
              leagues={leagues.map((l) => ({ slug: l.slug, name: l.name, country: l.country }))}
              teams={teams.map((t) => ({ slug: t.slug, name: t.name }))}
              seasons={seasons}
              versions={versions}
              sizes={sizes}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-end justify-between gap-4 mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Catálogo
              </p>
              <h1 className="mt-1 font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">
                Camisetas
              </h1>
            </div>
            <p className="text-sm text-muted-foreground pb-1 shrink-0">
              {result.total} producto{result.total !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Mobile filters */}
          <div className="lg:hidden my-6">
            <details className="group">
              <summary className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
                <div className="flex items-center gap-2">
                  Filtros
                  {hasActiveFilters && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                      {activeFilters.length}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-3">
                <ProductFilters
                  leagues={leagues.map((l) => ({ slug: l.slug, name: l.name, country: l.country }))}
                  teams={teams.map((t) => ({ slug: t.slug, name: t.name }))}
                  seasons={seasons}
                  versions={versions}
                  sizes={sizes}
                />
              </div>
            </details>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {activeFilters.map((f) => (
                <a
                  key={f.param}
                  href={f.removeHref}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium hover:border-foreground/40 hover:bg-accent transition-colors"
                >
                  {f.label}
                  <X className="h-3 w-3 text-muted-foreground" />
                </a>
              ))}
              <Link
                href="/productos"
                className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Limpiar todo
              </Link>
            </div>
          )}

          <Suspense fallback={<CatalogSkeleton />}>
            {result.products.length === 0 ? (
              <EmptyState variant={hasActiveFilters ? "results" : "catalog"} />
            ) : (
              <ProductGrid products={result.products} priority />
            )}
          </Suspense>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-2 mt-10">
              {result.page > 1 ? (
                <Link
                  href={`/productos?page=${result.page - 1}${paramsToQuery(filters)}`}
                  aria-label="Página anterior"
                  className="flex h-10 items-center gap-1 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="flex h-10 cursor-not-allowed items-center gap-1 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground/50 opacity-50">
                  ← Anterior
                </span>
              )}

              {getPaginationItems(result.page, result.totalPages).map((item, i) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${i}`}
                    aria-hidden
                    className="flex h-10 items-center px-1 text-sm text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={`/productos?page=${item}${paramsToQuery(filters)}`}
                    aria-current={item === result.page ? "page" : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      item === result.page
                        ? "bg-foreground text-background"
                        : "bg-card border border-border hover:bg-accent text-foreground"
                    }`}
                  >
                    {item}
                  </Link>
                ),
              )}

              {result.page < result.totalPages ? (
                <Link
                  href={`/productos?page=${result.page + 1}${paramsToQuery(filters)}`}
                  aria-label="Página siguiente"
                  className="flex h-10 items-center gap-1 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="flex h-10 cursor-not-allowed items-center gap-1 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground/50 opacity-50">
                  Siguiente →
                </span>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

const SORT_LABELS: Record<string, string> = {
  newest: "Novedades",
  "price-asc": "Menor precio",
  "price-desc": "Mayor precio",
  "name-asc": "A-Z",
  "name-desc": "Z-A",
};

type FilterLookups = {
  league: Map<string, string>;
  team: Map<string, string>;
  season: Map<string, string>;
  version: Map<string, string>;
};

function buildActiveFilters(
  raw: ReturnType<typeof parseProductFiltersParams>,
  lookups: FilterLookups,
): {
  param: string;
  label: string;
  removeHref: string;
}[] {
  const labels: {
    key: keyof typeof raw;
    param: string;
    label: string;
    format: (value: string) => string;
  }[] = [
    { key: "liga", param: "liga", label: "Liga", format: (v) => lookups.league.get(v) ?? v },
    { key: "equipo", param: "equipo", label: "Equipo", format: (v) => lookups.team.get(v) ?? v },
    { key: "temporada", param: "temporada", label: "Temporada", format: (v) => lookups.season.get(v) ?? v },
    { key: "version", param: "version", label: "Versión", format: (v) => lookups.version.get(v) ?? v },
    { key: "talla", param: "talla", label: "Talla", format: (v) => v },
    {
      key: "disponibilidad",
      param: "disponibilidad",
      label: "Disponibilidad",
      format: (v) => (v === "AVAILABLE" ? "Disponible" : "Agotado"),
    },
    { key: "q", param: "q", label: "Búsqueda", format: (v) => v },
    { key: "sort", param: "sort", label: "Orden", format: (v) => SORT_LABELS[v] ?? v },
  ];

  return labels.flatMap(({ key, param, label, format }) => {
    const value = raw[key];
    if (typeof value !== "string" || !value || (key === "sort" && value === "default")) return [];
    const url = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) {
      if (k === param || typeof v !== "string" || !v || (k === "sort" && v === "default")) continue;
      url.set(k, v);
    }
    return [{ param, label: `${label}: ${format(value)}`, removeHref: `/productos?${url.toString()}` }];
  });
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <Skeleton variant="rectangular" className="aspect-[3/4]" />
          <div className="p-3.5 space-y-2">
            <Skeleton variant="text" className="h-3 w-3/4" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getPaginationItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | "ellipsis")[] = [1];
  if (current > 3) items.push("ellipsis");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    items.push(p);
  }
  if (current < total - 2) items.push("ellipsis");
  items.push(total);
  return items;
}

function paramsToQuery(filters: FilterParams): string {
  const p = new URLSearchParams();
  if (filters.league) p.set("liga", filters.league);
  if (filters.team) p.set("equipo", filters.team);
  if (filters.season) p.set("temporada", filters.season);
  if (filters.version) p.set("version", filters.version);
  if (filters.size) p.set("talla", filters.size);
  if (filters.availability) p.set("disponibilidad", filters.availability);
  if (filters.search) p.set("q", filters.search);
  if (filters.sort && filters.sort !== "default") p.set("sort", filters.sort);
  return p.toString() ? `&${p.toString()}` : "";
}