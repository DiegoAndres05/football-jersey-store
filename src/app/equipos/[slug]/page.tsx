import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeamBySlug } from "@/features/products/repositories/product-repository";
import { ProductGrid } from "@/features/products/components/product-grid";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { getProducts } from "@/features/products/repositories/product-repository";
import { appendKeywords } from "@/features/seo/domain/keywords";
import { buildBreadcrumbJsonLd } from "@/features/seo/domain/breadcrumb-json-ld";
import { serializeJsonLd } from "@/features/seo/domain/serialize-json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = resolvePublicOrigin();

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);

  if (!team) return { title: "Equipo no encontrado" };

  const leagueName = team.league?.name ? ` · ${team.league.name}` : "";
  const description = `Camisetas de fútbol de ${team.name}${leagueName}. Temporadas y tallas disponibles.`;
  const canonical = `${siteUrl}/equipos/${team.slug}`;

  return {
    title: `${team.name} — Camisetas de fútbol`,
    description,
    keywords: appendKeywords(
      `camiseta ${team.name}`,
      `camiseta de fútbol ${team.name}`,
      `camiseta ${team.name} Colombia`,
    ),
    alternates: { canonical },
    openGraph: {
      title: `${team.name} — Camisetas de fútbol`,
      description,
      url: canonical,
      siteName: "Flashsport",
      type: "website",
      locale: "es_CO",
      images: team.crestUrl
        ? [{ url: team.crestUrl, alt: `Escudo de ${team.name}` }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${team.name} — Camisetas de fútbol`,
      description,
      images: team.crestUrl ? [team.crestUrl] : undefined,
    },
  };
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);

  if (!team) {
    notFound();
  }

  const [products, currencyCtx] = await Promise.all([
    getProducts({ team: slug }),
    getCurrencyContext(),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    ...(team.league
      ? [
          { name: "Ligas", path: "/ligas" },
          { name: team.league.name, path: `/ligas/${team.league.slug}` },
        ]
      : []),
    { name: team.name, path: `/equipos/${team.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="container-page py-8 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {team.league?.name ?? "Equipo"}
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">
          {team.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {team.activeProducts} producto{team.activeProducts !== 1 ? "s" : ""} disponible{team.activeProducts !== 1 ? "s" : ""}
        </p>

        <div className="mt-8">
          <ProductGrid products={products.products} currencyContext={currencyCtx} />
        </div>
      </div>
    </>
  );
}
