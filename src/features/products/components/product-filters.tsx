"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

type League = { slug: string; name: string; country: string | null };
type Season = { id: string; slug: string; name: string; isRetro: boolean };
type Version = { id: string; slug: string; name: string; priceAdjustment: number };
type Size = { id: string; code: string; name: string };

const SORT_OPTIONS = [
  { value: "default", label: "Destacados" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "name-asc", label: "A-Z" },
  { value: "name-desc", label: "Z-A" },
  { value: "newest", label: "Más nuevos" },
] as const;

export function ProductFilters({
  leagues,
  seasons,
  versions,
  sizes,
  className,
}: {
  leagues: League[];
  seasons: Season[];
  versions: Version[];
  sizes: Size[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = {
    league: searchParams.get("liga") ?? "",
    season: searchParams.get("temporada") ?? "",
    version: searchParams.get("version") ?? "",
    size: searchParams.get("talla") ?? "",
    search: searchParams.get("q") ?? "",
    sort: searchParams.get("sort") ?? "default",
  };

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasActiveFilters = Object.values(active).some((v) => v && v !== "default");

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar..."
          defaultValue={active.search}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("q", (e.target as HTMLInputElement).value);
            }
          }}
          className="pl-9"
        />
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Ordenar</label>
        <select
          value={active.sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* League */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Liga</label>
        <div className="flex flex-wrap gap-1.5">
          {leagues.map((l) => (
            <button
              key={l.slug}
              onClick={() => setParam("liga", active.league === l.slug ? "" : l.slug)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                active.league === l.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Season */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Temporada</label>
        <div className="flex flex-wrap gap-1.5">
          {seasons.map((s) => (
            <button
              key={s.slug}
              onClick={() => setParam("temporada", active.season === s.slug ? "" : s.slug)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                active.season === s.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {s.isRetro ? `Retro ${s.name.replace("Retro ", "")}` : s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Version */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Versión</label>
        <div className="flex flex-wrap gap-1.5">
          {versions.map((v) => (
            <button
              key={v.slug}
              onClick={() => setParam("version", active.version === v.slug ? "" : v.slug)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                active.version === v.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Talla</label>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((s) => (
            <button
              key={s.code}
              onClick={() => setParam("talla", active.size === s.code ? "" : s.code)}
              className={cn(
                "h-8 w-8 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center",
                active.size === s.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {s.code}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
