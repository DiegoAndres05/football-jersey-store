import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeagueBySlug } from "@/features/products/repositories/product-repository";
import { ProductGrid } from "@/features/products/components/product-grid";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { getProducts } from "@/features/products/repositories/product-repository";
import { buildBreadcrumbJsonLd } from "@/features/seo/domain/breadcrumb-json-ld";
import { serializeJsonLd } from "@/features/seo/domain/serialize-json-ld";
import { appendKeywords } from "@/features/seo/domain/keywords";
import { leagueLogoSrc } from "@/features/products/domain/league-logos";
import { formatCatalogStockLabel } from "@/features/products/domain/catalog-stock-label";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = resolvePublicOrigin();

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const league = await getLeagueBySlug(slug);

  if (!league) return { title: "Liga no encontrada" };

  const description = `Compra camisetas de fútbol de ${league.name} en Colombia. Explora equipos, temporadas y tallas disponibles en Flashsport, con personalización y envíos nacionales.`;
  const canonical = `${siteUrl}/ligas/${league.slug}`;
  const socialImage = leagueLogoSrc(league.slug) ?? "/flashsport-mark.png";
  const socialImageAlt = leagueLogoSrc(league.slug)
    ? `Logo de ${league.name}`
    : `Flashsport — camisetas de fútbol de ${league.name}`;

  return {
    title: `Camisetas de fútbol de ${league.name} en Colombia | Flashsport`,
    description,
    keywords: appendKeywords(
      `camisetas de fútbol ${league.name}`,
      `camisetas de equipos ${league.name}`,
      `camisetas ${league.name} Colombia`,
    ),
    alternates: { canonical },
    openGraph: {
      title: `${league.name} — Camisetas de fútbol`,
      description,
      url: canonical,
      siteName: "Flashsport",
      type: "website",
      locale: "es_CO",
      images: [{ url: socialImage, alt: socialImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Camisetas de fútbol de ${league.name} en Colombia | Flashsport`,
      description,
      images: [socialImage],
    },
  };
}

export default async function LeagueDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const league = await getLeagueBySlug(slug);

  if (!league) {
    notFound();
  }

  const [products, currencyCtx] = await Promise.all([
    getProducts({ league: slug }),
    getCurrencyContext(),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Ligas", path: "/ligas" },
    { name: league.name, path: `/ligas/${league.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="container-page py-8 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Liga
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">
          {league.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {formatCatalogStockLabel({
            total: league.activeProducts,
            purchasable: league.purchasableCount,
            soldOut: league.soldOutCount,
          })}
        </p>

        <div className="mt-8">
          <ProductGrid products={products.products} currencyContext={currencyCtx} />
        </div>
      </div>
    </>
  );
}
