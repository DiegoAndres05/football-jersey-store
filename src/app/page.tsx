import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/features/products/components/product-grid";
import {
  getFeaturedProducts,
  getLeagues,
} from "@/features/products/repositories/product-repository";
import { whatsappLink } from "@/shared/config/site";
import { HeroProduct } from "@/components/home/hero-product";
import { getCurrencyContext } from "@/shared/money/server-helpers";

const BIG_LEAGUES = ["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"] as const;

const LEAGUE_MONOGRAMS: Record<string, string> = {
  "premier-league": "PL",
  "la-liga": "LAL",
  "serie-a": "SA",
  "bundesliga": "BL",
  "ligue-1": "L1",
};

const TRUST_ITEMS = [
  { icon: Truck, label: "Envíos a todo el país" },
  { icon: ShieldCheck, label: "Pagos seguros" },
  { icon: BadgeCheck, label: "Productos de calidad" },
  { icon: Headphones, label: "Atención personalizada" },
] as const;

export default async function HomePage() {
  const [featured, leagues, currencyCtx] = await Promise.all([getFeaturedProducts(8), getLeagues(), getCurrencyContext()]);

  const heroProduct = featured[0] ?? null;

  const leaguesBySlug = new Map(leagues.map((l) => [l.slug, l]));
  const bigLeagues = BIG_LEAGUES.map((slug) => leaguesBySlug.get(slug)).filter(
    (l): l is NonNullable<typeof l> => l !== undefined,
  );

  const featuredProducts = featured.slice(0, 4);

  return (
    <div>
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="container-page grid items-center gap-10 pb-16 pt-10 md:pb-20 md:pt-14 lg:grid-cols-12 lg:gap-6">
          {/* Texto */}
          <div className="lg:col-span-6 lg:pr-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Tienda de camisetas de fútbol
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight md:text-6xl xl:text-7xl">
              Viste tu
              <br />
              pasión.
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
              Camisetas de fútbol de las mejores ligas del mundo. Equipos,
              temporadas y tallas reales, con envío a todo el país.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/productos">
                  Comprar ahora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/ligas">Explorar ligas</Link>
              </Button>
            </div>
          </div>

          {/* Fotografía de producto */}
          <div className="lg:col-span-6">
            <HeroProduct product={heroProduct} />
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-px border-b border-border bg-border md:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-center gap-2.5 bg-background px-3 py-4"
          >
            <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── LAS GRANDES LIGAS ──────────────────────────────────────── */}
      <section className="container-page py-16 md:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
              Las grandes ligas
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Encuentra las camisetas de tus equipos por liga.
            </p>
          </div>
          <Link
            href="/productos"
            className="hidden items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] hover:underline underline-offset-4 sm:inline-flex"
          >
            Ver todo el catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {bigLeagues.map((league) => (
            <Link
              key={league.slug}
              href={`/productos?liga=${league.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/40 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary font-display text-sm font-bold uppercase tracking-tight transition-colors group-hover:bg-foreground group-hover:text-background">
                {LEAGUE_MONOGRAMS[league.slug] ?? league.name.slice(0, 3).toUpperCase()}
              </span>
              <span className="mt-4 font-display text-lg font-bold uppercase leading-tight tracking-tight">
                {league.name}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {league.productCount > 0
                  ? `${league.productCount} producto${league.productCount !== 1 ? "s" : ""}`
                  : "Próximamente"}
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-foreground">
                Ver liga
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── LAS MÁS BUSCADAS ───────────────────────────────────────── */}
      <section className="border-t border-border bg-card/50">
        <div className="container-page py-16 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
                Las más buscadas
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Las camisetas que todos están comprando.
              </p>
            </div>
            <Link
              href="/productos"
              className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] hover:underline underline-offset-4"
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8">
            <ProductGrid products={featuredProducts} priority currencyContext={currencyCtx} />
          </div>
        </div>
      </section>

      {/* ── WHATSAPP ───────────────────────────────────────────────── */}
      <section className="container-page py-16 md:py-20">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center md:px-14">
          <div className="relative mx-auto max-w-xl">
            <h2 className="font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight md:text-4xl">
              ¿No encuentras la camiseta
              <br />
              que buscas?
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Tenemos acceso a muchas más camisetas, equipos y temporadas de
              las que publicamos. Escríbenos y te ayudamos a conseguirla.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" asChild>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  Consultar por WhatsApp
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Pedidos por encargo · Las 5 grandes ligas y muchas más
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
