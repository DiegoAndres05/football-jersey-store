import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/features/products/repositories/product-repository";
import { ProductDetailClient } from "@/features/products/components/product-detail-client";
import { ProductGrid } from "@/features/products/components/product-grid";
import { getCurrencyContext } from "@/shared/money/server-helpers";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { buildProductJsonLd } from "@/features/seo/domain/product-json-ld";
import { buildBreadcrumbJsonLd } from "@/features/seo/domain/breadcrumb-json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = resolvePublicOrigin();

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Producto no encontrado" };

  const description = product.description ?? `${product.name} - ${product.team.name} · ${product.season.name}`;
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const imageUrl = primaryImage?.url;
  const productUrl = `${siteUrl}/productos/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: productUrl },
    openGraph: {
      title: product.name,
      description,
      url: productUrl,
      siteName: "Flashsport",
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
      type: "website",
      locale: "es_CO",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, currencyCtx] = await Promise.all([
    getProductBySlug(slug),
    getCurrencyContext(),
  ]);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product);

  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const imageUrl = primaryImage?.url;

  const jsonLd = buildProductJsonLd({
    slug: product.slug,
    name: product.name,
    description: product.description,
    brand: product.brand,
    kitType: product.kitType,
    imageUrl,
    teamName: product.team.name,
    seasonName: product.season.name,
    variants: product.variants.map((v) => ({
      sku: v.sku,
      salePrice: v.salePrice,
      stock: v.availability,
    })),
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Catálogo", path: "/productos" },
    { name: product.name, path: `/productos/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ProductDetailClient product={product} currencyContext={currencyCtx} />

      {related.length > 0 && (
        <section className="container-page py-10 border-t border-border">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">También te puede interesar</h2>
              <p className="text-sm text-muted-foreground">
                Más camisetas de {product.team.name}
                {product.team.league ? ` y su liga` : ""}.
              </p>
            </div>
            <Link
              href={`/equipos/${product.team.slug}`}
              className="hidden sm:flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductGrid products={related} currencyContext={currencyCtx} />
        </section>
      )}
    </>
  );
}