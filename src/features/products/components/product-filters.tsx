"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";

type League = { slug: string; name: string; country: string | null };
type Team = { slug: string; name: string };
type Season = { id: string; slug: string; name: string; isRetro: boolean };
type Version = { id: string; slug: string; name: string; priceAdjustment: number };
type Size = { id: string; code: string; name: string };

const SORT_OPTIONS = [
  { value: "default", label: "Destacados" },
  { value: "newest", label: "Novedades" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "name-asc", label: "A-Z" },
  { value: "name-desc", label: "Z-A" },
] as const;

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "OUT_OF_STOCK", label: "Agotado" },
] as const;

const DELIVERY_MODE_OPTIONS = [
  { value: "INMEDIATA", label: "Entrega inmediata" },
  { value: "BAJO_PEDIDO", label: "Bajo pedido" },
] as const;

export function buildFilterHref(
  pathname: string,
  current: string,
  key: string,
  value: string,
): string {
  const params = new URLSearchParams(current);
  if (value) params.set(key, value);
  else params.delete(key);
  if (key === "liga") params.delete("equipo");
  params.set("page", "1");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function countActiveProductFilters(params: URLSearchParams): number {
  return ["liga", "equipo", "temporada", "version", "talla", "disponibilidad", "modalidad", "q"]
    .filter((key) => Boolean(params.get(key))).length + (params.get("sort") && params.get("sort") !== "default" ? 1 : 0);
}

function Chip({
  active,
  onClick,
  children,
  className,
  square = false,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  square?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        square && "h-9 w-9 px-0 flex items-center justify-center",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ProductFilters({
  leagues,
  teams,
  seasons,
  versions,
  sizes,
  className,
}: {
  leagues: League[];
  teams: Team[];
  seasons: Season[];
  versions: Version[];
  sizes: Size[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const active = {
    league: searchParams.get("liga") ?? "",
    team: searchParams.get("equipo") ?? "",
    season: searchParams.get("temporada") ?? "",
    version: searchParams.get("version") ?? "",
    size: searchParams.get("talla") ?? "",
    availability: searchParams.get("disponibilidad") ?? "",
    deliveryMode: searchParams.get("modalidad") ?? "",
    search: searchParams.get("q") ?? "",
    sort: searchParams.get("sort") ?? "default",
  };

  const setParam = useCallback(
    (key: string, value: string) => {
      startTransition(() => {
        router.push(buildFilterHref(pathname, searchParams.toString(), key, value), { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  const hasActiveFilters = countActiveProductFilters(new URLSearchParams(searchParams.toString())) > 0;
  return (
    <div className={cn("space-y-6", className)}>
      {isPending && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Actualizando…
        </p>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          key={active.search}
          placeholder="Buscar..."
          defaultValue={active.search}
          aria-label="Buscar camisetas por nombre o equipo"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("q", (e.target as HTMLInputElement).value);
            }
          }}
          className="pl-9 pr-9"
        />
        {active.search && (
          <button
            type="button"
            onClick={() => setParam("q", "")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <label htmlFor="catalog-sort" className="text-xs font-medium text-muted-foreground mb-2 block">Ordenar</label>
        <select
          id="catalog-sort"
          name="sort"
          value={active.sort}
          disabled={isPending}
          onChange={(e) => setParam("sort", e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Availability */}
      <fieldset>
        <legend className="text-xs font-medium text-muted-foreground mb-2 block">Disponibilidad</legend>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={active.availability === opt.value}
              disabled={isPending}
              onClick={() =>
                setParam("disponibilidad", active.availability === opt.value ? "" : opt.value)
              }
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Delivery mode */}
      <fieldset>
        <legend className="text-xs font-medium text-muted-foreground mb-2 block">Modalidad de entrega</legend>
        <div className="flex flex-wrap gap-1.5">
          {DELIVERY_MODE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={active.deliveryMode === opt.value}
              disabled={isPending}
              onClick={() =>
                setParam("modalidad", active.deliveryMode === opt.value ? "" : opt.value)
              }
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* League */}
      <fieldset>
        <label htmlFor="catalog-league" className="text-xs font-medium text-muted-foreground mb-2 block">Liga</label>
        <select
          id="catalog-league"
          name="liga"
          value={active.league}
          disabled={isPending}
          onChange={(event) => setParam("liga", event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Todas las ligas</option>
          {leagues.map((l) => (
            <option key={l.slug} value={l.slug}>{l.name}</option>
          ))}
        </select>
      </fieldset>

      {/* Team (cascada desde la liga) */}
      {active.league && teams.length > 0 && (
        <fieldset>
          <legend className="text-xs font-medium text-muted-foreground mb-2 block">Equipo</legend>
          <div className="flex flex-wrap gap-1.5">
            {teams.map((t) => (
              <Chip
                key={t.slug}
                active={active.team === t.slug}
                disabled={isPending}
                onClick={() => setParam("equipo", active.team === t.slug ? "" : t.slug)}
              >
                {t.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {/* Season */}
      <fieldset>
        <label htmlFor="catalog-season" className="text-xs font-medium text-muted-foreground mb-2 block">Temporada</label>
        <select
          id="catalog-season"
          name="temporada"
          value={active.season}
          disabled={isPending}
          onChange={(event) => setParam("temporada", event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Todas las temporadas</option>
          {seasons.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.isRetro ? `Retro ${s.name.replace("Retro ", "")}` : s.name}
            </option>
          ))}
        </select>
      </fieldset>

      {/* Version */}
      <fieldset>
        <legend className="text-xs font-medium text-muted-foreground mb-2 block">Versión</legend>
        <div className="flex flex-wrap gap-1.5">
          {versions.map((v) => (
            <Chip
              key={v.slug}
              active={active.version === v.slug}
              disabled={isPending}
              onClick={() => setParam("version", active.version === v.slug ? "" : v.slug)}
            >
              {v.name}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Size */}
      <fieldset>
        <legend className="text-xs font-medium text-muted-foreground mb-2 block">Talla</legend>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((s) => (
            <Chip
              key={s.code}
              square
              active={active.size === s.code}
              disabled={isPending}
              onClick={() => setParam("talla", active.size === s.code ? "" : s.code)}
            >
              {s.code}
            </Chip>
          ))}
        </div>
      </fieldset>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex min-h-10 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}