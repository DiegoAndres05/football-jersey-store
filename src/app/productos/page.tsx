import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts, getLeagues, getSeasons, getVersions, getSizes } from "@/features/products/repositories/product-repository";
import { ProductGrid } from "@/features/products/components/product-grid";
import { ProductFilters } from "@/features/products/components/product-filters";
import type { ProductFilters as FilterParams } from "@/features/products/types/product-types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters: FilterParams = {
    league: asString(params.liga),
    season: asString(params.temporada),
    version: asString(params.version),
    size: asString(params.talla),
    search: asString(params.q),
    sort: asSortOption(asString(params.sort)),
    page: parseInt(asString(params.page) || "1", 10) || 1,
  };

  const [result, leagues, seasons, versions, sizes] = await Promise.all([
    getProducts(filters),
    getLeagues(),
    getSeasons(),
    getVersions(),
    getSizes(),
  ]);

  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Catálogo</span>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 space-y-6">
            <h2 className="text-lg font-semibold">Filtros</h2>
            <ProductFilters
              leagues={leagues.map((l) => ({ slug: l.slug, name: l.name, country: l.country }))}
              seasons={seasons}
              versions={versions}
              sizes={sizes}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Catálogo</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {result.total} producto{result.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Mobile filters */}
          <div className="lg:hidden mb-6">
            <details className="group">
              <summary className="flex items-center gap-2 text-sm font-medium cursor-pointer rounded-xl border border-border p-3 hover:bg-accent transition-colors">
                Filtros
                <ChevronRight className="h-4 w-4 ml-auto transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-3">
                <ProductFilters
                  leagues={leagues.map((l) => ({ slug: l.slug, name: l.name, country: l.country }))}
                  seasons={seasons}
                  versions={versions}
                  sizes={sizes}
                />
              </div>
            </details>
          </div>

          <Suspense fallback={<CatalogSkeleton />}>
            <ProductGrid products={result.products} priority />
          </Suspense>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === result.page;
                return (
                  <Link
                    key={p}
                    href={`/productos?page=${p}${paramsToQuery(filters)}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border hover:bg-accent text-foreground"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <Skeleton variant="rectangular" className="aspect-[3/4]" />
          <div className="p-3 space-y-2">
            <Skeleton variant="text" className="h-3 w-3/4" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function asSortOption(v: string | undefined): FilterParams["sort"] {
  const valid = ["default", "price-asc", "price-desc", "name-asc", "name-desc", "newest"] as const;
  return valid.includes(v as any) ? (v as FilterParams["sort"]) : "default";
}

function paramsToQuery(filters: FilterParams): string {
  const p = new URLSearchParams();
  if (filters.league) p.set("liga", filters.league);
  if (filters.season) p.set("temporada", filters.season);
  if (filters.version) p.set("version", filters.version);
  if (filters.size) p.set("talla", filters.size);
  if (filters.search) p.set("q", filters.search);
  if (filters.sort && filters.sort !== "default") p.set("sort", filters.sort);
  return p.toString() ? `&${p.toString()}` : "";
}
