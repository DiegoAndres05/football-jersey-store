import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
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
import {
  BIG_LEAGUE_SLUGS,
  leagueLogo,
  leagueLogoSrc,
  leagueMonogram,
} from "@/features/products/domain/league-logos";
import { leagueLogoAlt } from "@/features/seo/domain/product-image-alt";
import { whatsappLink } from "@/shared/config/site";
import { HeroProduct } from "@/components/home/hero-product";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import {
  FeaturedHomepageSection,
  FeaturedHomepageSectionFallback,
} from "@/components/home/featured-homepage-section";
import { getMysteryBoxPage } from "@/features/products/repositories/product-repository";
import { publicHomeUrl } from "@/shared/config/public-origin";
import { INDEXABLE } from "@/features/seo/domain/robots-policy";
import { ProductImage } from "@/shared/ui/product-image";
import { Suspense } from "react";
import { appendKeywords } from "@/features/seo/domain/keywords";
import { HeroCopyAnimation } from "@/components/home/hero-copy-animation";
import { HeroHalloween } from "@/components/home/hero-halloween";
import { NameNumberPreview } from "@/components/home/name-number-preview";
import { formatMoney } from "@/shared/money/format";
import { discountPercent } from "@/features/products/domain/product-price-display";

export const metadata: Metadata = {
  title: "Camisetas de Fútbol en Colombia | Envíos Flashsport",
  description:
    "Camisetas de fútbol de las principales ligas y equipos del mundo. Elige tu temporada, talla y versión, con envíos a toda Colombia.",
  keywords: appendKeywords(
    "camisetas de fútbol en Colombia",
    "camisetas de fútbol por equipos",
    "camisetas de fútbol por tallas",
  ),
  robots: INDEXABLE,
  alternates: { canonical: publicHomeUrl() },
  openGraph: {
    title: "Camisetas de Fútbol en Colombia | Envíos Flashsport",
    description:
      "Camisetas de fútbol de las principales ligas y equipos del mundo. Elige tu temporada, talla y versión, con envíos a toda Colombia.",
    url: publicHomeUrl(),
    siteName: "Flashsport",
    type: "website",
    locale: "es_CO",
    images: [{ url: "/flashsport-logo.png", alt: "Flashsport" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Camisetas de Fútbol en Colombia | Envíos Flashsport",
    description:
      "Camisetas de fútbol de las principales ligas y equipos del mundo. Elige tu temporada, talla y versión, con envíos a toda Colombia.",
    images: ["/flashsport-logo.png"],
  },
};

const BIG_LEAGUES = BIG_LEAGUE_SLUGS;

const TRUST_ITEMS = [
  { icon: Truck, title: "Envíos a todo el país", body: "Interrapidísimo y Servientrega con número de guía." },
  { icon: ShieldCheck, title: "Pagos 100% seguros", body: "PSE, Nequi, Bancolombia y tarjetas bancarias." },
  { icon: BadgeCheck, title: "Productos de calidad", body: "Ediciones Fan y Player con bordados y vinilos HD." },
  { icon: Headphones, title: "Atención personalizada", body: "Asesoría directa en WhatsApp +57 304 614 9525." },
] as const;

export default async function HomePage() {
  const [featured, leagues, currencyCtx, mysteryBox] = await Promise.all([
    getFeaturedProducts(8),
    getLeagues(),
    getCurrencyContext(),
    getMysteryBoxPage(),
  ]);

  const heroProduct = featured[0] ?? null;
  const heroDiscount =
    heroProduct?.showPrice && heroProduct.displayPrice !== null
      ? discountPercent(heroProduct.displayPrice, heroProduct.compareAtPrice)
      : null;
  const money = {
    currency: currencyCtx.currency,
    copPerUsd: currencyCtx.copPerUsd ?? undefined,
  };

  const leaguesBySlug = new Map(leagues.map((l) => [l.slug, l]));
  const bigLeagues = BIG_LEAGUES.map((slug) => leaguesBySlug.get(slug)).filter(
    (l): l is NonNullable<typeof l> => l !== undefined,
  );

  const featuredProducts = featured.slice(0, 4);

  return (
    <div>
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative overflow-x-clip">
        <div className="container-page relative z-10 pb-8 pt-4 md:pb-12 md:pt-5">
          <div className="grid items-stretch gap-8 rounded-[24px] border border-[#ece8e3] bg-white p-5 sm:p-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
            <div className="relative z-20 flex h-full flex-col">
              <div className="flex flex-1 flex-col justify-center py-4">
              <HeroCopyAnimation>
                <p data-hero-eyebrow className="inline-flex items-center gap-2 rounded-full bg-[#f4f3f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3f3f3f]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                  Temporada oficial 2026/27
                </p>
                <h1
                  data-hero-title
                  className="mt-5 text-[40px] font-extrabold uppercase leading-[0.9] tracking-[-0.045em] text-[#111] [font-family:var(--font-ui-heavy),var(--font-sans)] sm:text-[48px]"
                >
                  <span className="block">Camisetas de fútbol</span>
                  <span className="block">en Colombia</span>
                </h1>
                <p data-hero-description className="mt-4 max-w-[440px] text-[15px] leading-[1.55] text-[#6d6964]">
                  Camisetas de fútbol de las mejores ligas del mundo. Equipos,
                  temporadas y tallas reales, con envío seguro a todo el país y
                  personalización con nombre y dorsal.
                </p>
                <div data-hero-actions className="mt-6 flex flex-wrap items-center gap-3">
                  <Button size="lg" className="h-12 rounded-full px-6 text-[13px] font-bold uppercase tracking-[0.06em]" asChild>
                    <Link href="/productos">
                      Comprar ahora
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 rounded-full border-[#e4e0da] bg-white px-6 text-[13px] font-bold uppercase tracking-[0.06em]" asChild>
                    <Link href="/ligas">Explorar ligas</Link>
                  </Button>
                </div>
              </HeroCopyAnimation>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["100%", "Garantizadas"],
                  ["Fan & Player", "Versiones reales"],
                  ["Nacional", "Cobertura total"],
                ].map(([title, subtitle]) => (
                  <div key={title} className="rounded-2xl border border-[#eeeae5] bg-[#fbfaf8] px-3 py-3">
                    <p className="text-[14px] font-extrabold text-[#171717] [font-family:var(--font-ui-heavy),var(--font-sans)]">{title}</p>
                    <p className="mt-0.5 text-[12px] text-[#8a857f]">{subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[28rem] rounded-[22px] border border-[#eeeae5] bg-white p-4 lg:max-w-none">
              <div className="relative z-20 mb-3 flex items-center justify-between gap-3">
                <span className="shrink-0 rounded-md bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white [font-family:var(--font-ui-heavy),var(--font-sans)]">
                  {heroDiscount ? `Destacada -${heroDiscount}%` : "Destacada"}
                </span>
                <span className="min-w-0 truncate text-right text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a958e]">
                  {heroProduct?.team.league?.name ?? "Ligas"} · {heroProduct?.season.name ?? "2026/27"}
                </span>
              </div>
              <HeroProduct product={heroProduct} />
              <HeroHalloween />
              {heroProduct && (
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f0ece7] pt-4">
                  <div className="min-w-0">
                    <p className="text-[16px] font-extrabold leading-tight text-[#171717] [font-family:var(--font-ui-heavy),var(--font-sans)]">
                      {heroProduct.name}
                    </p>
                    <p className="mt-1 text-[13px] text-[#8a857f]">
                      {heroProduct.versionNames[0] ?? heroProduct.team.name}
                    </p>
                  </div>
                  {heroProduct.showPrice && heroProduct.displayPrice !== null && (
                    <div className="shrink-0 text-right">
                      {heroProduct.compareAtPrice !== null && heroDiscount ? (
                        <p className="whitespace-nowrap text-[12px] text-[#b0aaa3] line-through">
                          {formatMoney({ amountCop: heroProduct.compareAtPrice, ...money })}
                        </p>
                      ) : null}
                      <p className="whitespace-nowrap text-[22px] font-extrabold leading-none tracking-[-0.03em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
                        {formatMoney({ amountCop: heroProduct.displayPrice, ...money })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────────────────── */}
      <div className="container-page grid gap-3 pb-4 sm:grid-cols-2 xl:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="flex gap-3 rounded-[18px] border border-[#ece8e3] bg-white p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f4f2ee] text-[#2a2a2a]">
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[14px] font-extrabold leading-tight text-[#171717] [font-family:var(--font-ui-heavy),var(--font-sans)]">{item.title}</p>
              <p className="mt-1 text-[12.5px] leading-[1.35] text-[#8a857f]">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FEATURED COVERFLOW ──────────────────────────────────────── */}
      <Suspense fallback={<FeaturedHomepageSectionFallback />}>
        <FeaturedHomepageSection />
      </Suspense>

      {mysteryBox && mysteryBox.variants.length > 0 && (
        <section className="border-y border-border bg-card/30">
          <div className="container-page py-12 md:py-16">
            <div className="grid items-center gap-8 overflow-hidden rounded-2xl border border-border bg-background md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="relative aspect-[4/3] bg-secondary">
                <ProductImage
                  src={mysteryBox.imageUrl}
                  alt={mysteryBox.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                  fallbackLabel="Caja misteriosa"
                />
              </div>
              <div className="px-6 pb-8 md:px-10 md:py-10">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Una elección sorpresa
                </p>
                <h2 className="mt-2 text-3xl font-extrabold uppercase tracking-[-0.03em] [font-family:var(--font-ui-heavy),var(--font-sans)] md:text-4xl">
                  Caja misteriosa
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  {mysteryBox.description}
                </p>
                <Button className="mt-6 h-12 rounded-full px-6" asChild>
                  <Link href="/caja-misteriosa">
                    Descubrir la caja
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── LAS GRANDES LIGAS ──────────────────────────────────────── */}
      <section className="container-page py-10 md:py-14">
        <div className="rounded-[24px] border border-[#ece8e3] bg-white px-5 py-6 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a39e97]">
              Colecciones oficiales
            </p>
            <h2 className="mt-1 text-[28px] font-extrabold uppercase leading-none tracking-[-0.03em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
              Las grandes ligas
            </h2>
          </div>
          <Link
            href="/productos"
            className="hidden items-center gap-1 text-[12px] font-extrabold uppercase tracking-[0.08em] underline decoration-1 underline-offset-4 sm:inline-flex [font-family:var(--font-ui-heavy),var(--font-sans)]"
          >
            Ver catálogo completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {bigLeagues.map((league) => {
            const liga = league.name;
            const logo = leagueLogo(league.slug, league.name);
            const logoSrc = logo.src ?? leagueLogoSrc(league.slug);
            const fallbackMonogram = leagueMonogram(league.slug, league.name);
            return (
              <Link
                key={league.slug}
                href={`/productos?liga=${league.slug}&sort=default`}
                aria-label={`Ver camisetas de ${liga}`}
                className="rounded-2xl border border-[#eeeae5] bg-white px-3 py-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f5f3ef]">
                  {logoSrc ? (
                    <Image
                      src={logoSrc}
                      alt={leagueLogoAlt(league.name)}
                      width={36}
                      height={36}
                      unoptimized
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <span className="text-[11px] font-extrabold uppercase [font-family:var(--font-ui-heavy),var(--font-sans)]" aria-hidden="true">
                      {fallbackMonogram}
                    </span>
                  )}
                </span>
                <p className="mt-3 text-[12px] font-extrabold uppercase tracking-[0.04em] text-[#1a1a1a] [font-family:var(--font-ui-heavy),var(--font-sans)]">
                  {liga}
                </p>
                <p className="mt-0.5 text-[12px] text-[#9a958e]">{league.country}</p>
              </Link>
            );
          })}
          <Link
            href="/ligas"
            className="rounded-2xl border border-[#eeeae5] bg-white px-3 py-5 text-center"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f5f3ef] text-[18px]" aria-hidden="true">
              🌐
            </span>
            <p className="mt-3 text-[12px] font-extrabold uppercase tracking-[0.04em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
              Selecciones
            </p>
            <p className="mt-0.5 text-[12px] text-[#9a958e]">Mundiales</p>
          </Link>
        </div>
        </div>
      </section>

      {/* ── LAS MÁS BUSCADAS ───────────────────────────────────────── */}
      <section className="border-t border-border bg-card/50">
        <div className="container-page py-16 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-extrabold uppercase tracking-[-0.03em] [font-family:var(--font-ui-heavy),var(--font-sans)] md:text-4xl">
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
            <ProductGrid products={featuredProducts} currencyContext={currencyCtx} />
          </div>
        </div>
      </section>

      <section className="container-page py-4 md:py-8">
        <div className="grid items-center gap-8 rounded-[24px] border border-[#ece8e3] bg-white px-6 py-7 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a857f]">
              <span aria-hidden="true">✎</span> Estampado oficial matchday
            </p>
            <h2 className="mt-4 text-[32px] font-extrabold uppercase leading-[0.95] tracking-[-0.035em] [font-family:var(--font-ui-heavy),var(--font-sans)] sm:text-[36px]">
              Personalización con nombre y número
            </h2>
            <p className="mt-3 max-w-[460px] text-[14.5px] leading-[1.5] text-[#6f6b66]">
              Agrega tu nombre, el de tu jugador favorito o fecha especial con tipografías oficiales termofijadas con acabado profesional de larga duración.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Tipografías Oficiales de Liga", "Parches de Competición", "Fijación Térmica HD"].map((chip) => (
                <span key={chip} className="rounded-full bg-[#f3f1ed] px-3 py-1.5 text-[12px] text-[#5f5b56]">
                  {chip}
                </span>
              ))}
            </div>
            <p className="mt-6 text-[13.5px] text-[#6f6b66]">
              Disponible en todas las camisetas bajo pedido:{" "}
              <span className="font-extrabold text-[#171717] [font-family:var(--font-ui-heavy),var(--font-sans)]">+$15.000 COP</span>
            </p>
          </div>
          <NameNumberPreview />
        </div>
      </section>

      {/* ── WHATSAPP ───────────────────────────────────────────────── */}
      <section className="container-page py-10 md:py-14">
        <div className="flex flex-col gap-8 rounded-[24px] border border-[#ece8e3] bg-white px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eefbf3] px-3 py-1 text-[12px] font-semibold text-[#178a45]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              Servicio Concierge Directo
            </span>
            <h2 className="mt-4 text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.035em] [font-family:var(--font-ui-heavy),var(--font-sans)] sm:text-[34px]">
              ¿No encuentras la camiseta que buscas?
            </h2>
            <p className="mt-3 max-w-[560px] text-[14.5px] leading-[1.5] text-[#6f6b66]">
              Tenemos acceso a muchas más camisetas, clubes exóticos, selecciones de época y
              temporadas históricas de las que publicamos. Escríbenos directamente y te ayudamos
              a conseguirla.
            </p>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#3f3f3f]">
              {["Pedidos por encargo", "Las 5 grandes ligas", "Copas del Mundo y retro"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {item}
                </span>
              ))}
            </p>
          </div>
          <div className="shrink-0">
            <Button size="lg" className="h-12 rounded-full px-5 text-[13px] font-bold uppercase tracking-[0.04em]" asChild>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                Consultar por WhatsApp
              </a>
            </Button>
            <p className="mt-2 text-[12px] text-[#8a857f]">+57 304 614 9525 · Respuesta en minutos</p>
          </div>
        </div>
      </section>
    </div>
  );
}
