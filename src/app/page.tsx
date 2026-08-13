import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/features/products/components/product-grid";
import { getFeaturedProducts, getLeagues } from "@/features/products/repositories/product-repository";
import { SITE, whatsappLink } from "@/shared/config/site";
import { JerseyHeroVisual } from "@/components/home/jersey-hero-visual";

const TRUST_ITEMS = [
  "Envíos a todo el país",
  "Pagos seguros",
  "Productos de calidad",
  "Atención personalizada",
] as const;

const BIG_LEAGUES = ["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"] as const;

export default async function HomePage() {
  const [featured, leagues] = await Promise.all([getFeaturedProducts(8), getLeagues()]);

  const leaguesBySlug = new Map(leagues.map((l) => [l.slug, l]));
  const bigLeagues = BIG_LEAGUES.map((slug) => leaguesBySlug.get(slug)).filter(
    (l): l is NonNullable<typeof l> => l !== undefined,
  );

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container-page grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-14 py-16 md:py-24 lg:py-28">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Tienda de camisetas de fútbol
            </p>
            <h1 className="mt-5 font-display font-bold uppercase tracking-tight leading-[0.92] text-6xl sm:text-7xl lg:text-8xl max-w-xl">
              Viste tu
              <br />
              pasión.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
              {SITE.tagline} Calidad, personalización y envíos a toda Colombia.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
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
            <p className="mt-5 text-sm text-muted-foreground">
              Envío gratis desde $200.000 en pedidos nacionales
            </p>
          </div>

          <JerseyHeroVisual />
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border bg-card">
        <div className="container-page py-5">
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {TRUST_ITEMS.map((item, i) => (
              <li key={item} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-border">·</span>}
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Las grandes ligas */}
      <section className="border-b border-border">
        <div className="container-page py-16 md:py-20">
          <SectionHeading
            kicker="Competiciones"
            title="Las grandes ligas"
            action={{ href: "/ligas", label: "Ver todas" }}
          />
          <div className="mt-10">
            {bigLeagues.map((league, i) => (
              <Link
                key={league.slug}
                href={`/productos?liga=${league.slug}`}
                className="group flex items-center justify-between gap-6 border-b border-border py-5 last:border-b-0 transition-colors hover:bg-card"
              >
                <span className="font-display text-sm font-semibold tracking-widest text-muted-foreground select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
                  {league.name}
                </span>
                <span className="hidden sm:block text-sm text-muted-foreground">
                  {league.country}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {league.productCount > 0
                    ? `${league.productCount} producto${league.productCount !== 1 ? "s" : ""}`
                    : "Próximamente"}
                </span>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Las más buscadas */}
      <section className="container-page py-16 md:py-20">
        <SectionHeading
          kicker="Destacados"
          title="Las más buscadas"
          action={{ href: "/productos", label: "Ver catálogo" }}
        />
        <div className="mt-10">
          <ProductGrid products={featured} priority />
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="container-page pb-20">
        <div className="rounded-2xl bg-foreground text-background px-8 py-16 md:px-16 md:py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-background/60">
            ¿No encuentras la camiseta que buscas?
          </p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Tenemos acceso a muchas más
            <br className="hidden md:block" />
            camisetas, equipos y temporadas.
          </h2>
          <p className="mt-5 text-background/70 max-w-xl mx-auto leading-relaxed">
            Escríbenos por WhatsApp, cuéntanos qué buscas y te ayudamos a conseguirlo.
          </p>
          <Button
            size="lg"
            className="mt-9 bg-background text-foreground hover:bg-background/90"
            asChild
          >
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              Consultar por WhatsApp
            </a>
          </Button>
          <p className="mt-4 text-sm text-background/60">{SITE.whatsappNumber}</p>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {kicker}
        </p>
        <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">
          {title}
        </h2>
      </div>
      {action && (
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link href={action.href}>
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}