import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeagueBySlug } from "@/features/products/repositories/product-repository";
import { ProductGrid } from "@/features/products/components/product-grid";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { getProducts } from "@/features/products/repositories/product-repository";
import { buildBreadcrumbJsonLd } from "@/features/seo/domain/breadcrumb-json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = resolvePublicOrigin();

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const league = await getLeagueBySlug(slug);

  if (!league) return { title: "Liga no encontrada" };

  const description = `Camisetas de fútbol de ${league.name}. Explora equipos y temporadas disponibles.`;
  const canonical = `${siteUrl}/ligas/${league.slug}`;

  return {
    title: `${league.name} — Camisetas de fútbol`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${league.name} — Camisetas de fútbol`,
      description,
      url: canonical,
      siteName: "Flashsport",
      type: "website",
      locale: "es_CO",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container-page py-8 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Liga
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">
          {league.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {league.activeProducts} producto{league.activeProducts !== 1 ? "s" : ""} disponible{league.activeProducts !== 1 ? "s" : ""}
        </p>

        <div className="mt-8">
          <ProductGrid products={products.products} currencyContext={currencyCtx} />
        </div>
      </div>
    </>
  );
}
