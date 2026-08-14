import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/features/products/components/product-grid";
import {
  getFeaturedProducts,
  getLeagues,
  getProducts,
} from "@/features/products/repositories/product-repository";
import { SITE, whatsappLink } from "@/shared/config/site";
import { formatPriceShort } from "@/lib/utils";
import { HeroProduct } from "@/components/home/hero-product";
import { Ticker } from "@/components/home/ticker";

const BIG_LEAGUES = ["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"] as const;

const HERO_META = ["Local · Visitante · Tercera", "Fan · Player · Retro", "Nombre y número"] as const;

const HERO_TRUST = [
  "Envíos a todo el país",
  "Pagos seguros",
  "Despacho 24–48h",
  "Envío gratis desde $200.000",
] as const;

export default async function HomePage() {
  const [featured, leagues, newest] = await Promise.all([
    getFeaturedProducts(8),
    getLeagues(),
    getProducts({ sort: "newest", page: 1 }),
  ]);

  const heroProduct = featured[0] ?? null;

  const leaguesBySlug = new Map(leagues.map((l) => [l.slug, l]));
  const bigLeagues = BIG_LEAGUES.map((slug) => leaguesBySlug.get(slug)).filter(
    (l): l is NonNullable<typeof l> => l !== undefined,
  );

  const newSeasonProducts = newest.products.slice(0, 4);

  return (
    <div>
      {/* ── 01 · HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-page grid lg:grid-cols-12 gap-10 lg:gap-6 pt-10 md:pt-14 lg:pt-16 pb-14 md:pb-20 items-center">
          {/* Columna tipográfica */}
          <div className="lg:col-span-7 lg:pr-10">
            <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              <span>{SITE.brand}</span>
              <span aria-hidden className="h-px flex-1 max-w-16 bg-border" />
              <span>Edición 25/26</span>
            </div>

            <h1 className="mt-6 font-display font-bold uppercase leading-[0.88] tracking-tight">
              <span className="block text-[clamp(3.5rem,10vw,8.5rem)]">Viste tu</span>
              <span className="block text-[clamp(3.5rem,10vw,8.5rem)] text-outline">pasión.</span>
            </h1>

            <p className="mt-7 max-w-md text-base md:text-lg text-muted-foreground leading-relaxed">
              Camisetas de fútbol seleccionadas para quienes viven el juego. Kit oficiales de tus
              ligas favoritas, con tallas reales y envío a todo el país.
            </p>

            {/* Metadata del producto */}
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
              {HERO_META.map((item, i) => (
                <li key={item} className="flex items-center gap-6">
                  {i > 0 && <span aria-hidden className="h-3.5 w-px bg-border" />}
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" className="group" asChild>
                <Link href="/productos">
                  Comprar ahora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Link
                href="/ligas"
                className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] hover:underline underline-offset-4"
              >
                Explorar ligas
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Columna del producto */}
          <div className="lg:col-span-5">
            <HeroProduct product={heroProduct} />
          </div>
        </div>

        {/* Trust integrado al hero, discreto */}
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-border divide-x divide-border">
            {HERO_TRUST.map((item) => (
              <p
                key={item}
                className="py-4 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground px-2"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <Ticker />

      {/* ── 02 · GRANDES LIGAS ────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="container-page py-16 md:py-20 lg:py-24">
          <SectionHeading index="01" kicker="Competiciones" title="Las grandes ligas" />
          <div className="mt-10">
            {bigLeagues.map((league, i) => (
              <Link
                key={league.slug}
                href={`/productos?liga=${league.slug}`}
                className="group flex items-center gap-4 md:gap-6 border-b border-border py-5 md:py-6 last:border-b-0 transition-colors hover:bg-card"
              >
                <span className="font-display text-lg md:text-xl font-bold text-outline-faint select-none tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-display text-3xl md:text-5xl font-bold uppercase tracking-tight transition-transform duration-300 group-hover:translate-x-2">
                  {league.name}
                </span>
                <span className="hidden md:block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {league.country}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {league.productCount > 0
                    ? `${league.productCount} producto${league.productCount !== 1 ? "s" : ""}`
                    : "Próximamente"}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:border-foreground">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 03 · DESTACADAS ───────────────────────────────────────── */}
      <section className="container-page py-16 md:py-20 lg:py-24">
        <SectionHeading index="02" kicker="El catálogo" title="Las más buscadas" />
        <div className="mt-10">
          <ProductGrid products={featured} priority />
        </div>
      </section>

      {/* ── 04 · NUEVA TEMPORADA ──────────────────────────────────── */}
      <section className="border-y border-border bg-foreground text-background">
        <div className="container-page grid lg:grid-cols-12 gap-10 py-16 md:py-20 lg:py-24 items-center">
          <div className="lg:col-span-6 lg:pr-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-background/50">
              03 · Nuevas temporadas
            </p>
            <h2 className="mt-4 font-display text-5xl md:text-7xl font-bold uppercase tracking-tight leading-[0.9]">
              La temporada
              <br />
              <span className="text-outline-invert">25/26</span> ya está
              <br />
              aquí.
            </h2>
            <p className="mt-6 max-w-md text-background/70 leading-relaxed">
              Los nuevos kits de tus equipos, listos con tallas reales desde la S hasta la XXL y
              personalización con nombre y número.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90" asChild>
                <Link href="/productos?sort=newest">
                  Ver lo nuevo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-background/50 text-[11px] font-semibold uppercase tracking-[0.2em]">
                Despacho 24–48h
              </span>
            </div>
          </div>

          {newSeasonProducts.length > 0 && (
            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {newSeasonProducts.map((product, i) => (
                  <Link
                    key={product.id}
                    href={`/productos/${product.slug}`}
                    className={`group relative overflow-hidden ${i % 2 === 1 ? "translate-y-6" : ""}`}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden border border-background/20">
                      {product.primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.primaryImage.url}
                          alt={product.primaryImage.altText ?? product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-background/10 text-xs text-background/40">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <p className="mt-2 flex items-baseline justify-between gap-2 text-background/80">
                      <span className="truncate text-xs font-semibold uppercase tracking-[0.14em]">
                        {product.shortName ?? product.team.name}
                      </span>
                      <span className="shrink-0 text-xs font-bold tabular-nums">
                        {formatPriceShort(product.minPrice)}
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 05 · WHATSAPP ─────────────────────────────────────────── */}
      <section className="container-page py-16 md:py-20 lg:py-24">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-14 md:px-14 md:py-16">
          <span
            aria-hidden
            className="absolute -right-6 -bottom-10 font-display text-[10rem] md:text-[14rem] font-bold uppercase leading-none text-outline-faint select-none pointer-events-none"
          >
            FS
          </span>

          <div className="relative max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              04 · No está en el catálogo
            </p>
            <h2 className="mt-4 font-display text-4xl md:text-6xl font-bold uppercase tracking-tight leading-[0.92]">
              No encuentras tu
              <br />
              camiseta. La conseguimos.
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
              Tenemos acceso a más camisetas, equipos, ligas y temporadas de las que podemos
              publicar. Escríbenos qué buscas y te lo conseguimos.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  Consultar por {SITE.whatsappNumber}
                </a>
              </Button>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Respuesta en minutos · 7 días a la semana
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  index,
  kicker,
  title,
}: {
  index: string;
  kicker: string;
  title: string;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
          <span className="font-display text-base text-outline-faint tabular-nums">{index}</span>
          {kicker}
        </p>
        <h2 className="mt-3 font-display text-4xl md:text-6xl font-bold uppercase tracking-tight">
          {title}
        </h2>
      </div>
    </div>
  );
}