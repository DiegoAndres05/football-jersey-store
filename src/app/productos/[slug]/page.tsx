import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/features/products/repositories/product-repository";
import { ProductDetailClient } from "@/features/products/components/product-detail-client";
import { ProductGrid } from "@/features/products/components/product-grid";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.name,
    description: product.description ?? `${product.name} - ${product.team.name}`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product);

  return (
    <>
      <ProductDetailClient product={product} />

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
              href={`/productos?equipo=${product.team.slug}`}
              className="hidden sm:flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}