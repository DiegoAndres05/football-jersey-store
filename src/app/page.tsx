import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/features/products/components/product-card";
import { ArrowRight, Truck, Shield, RefreshCw, Star } from "lucide-react";
import { getFeaturedProducts, getLeagues } from "@/features/products/repositories/product-repository";

const TRUST_ITEMS = [
  { icon: Truck, label: "Envío rápido", description: "A toda Colombia en 24-72h" },
  { icon: Shield, label: "Pago seguro", description: "Tarjeta, PSE, Nequi, Daviplata" },
  { icon: RefreshCw, label: "Cambios gratis", description: "Hasta 30 días después de la compra" },
  { icon: Star, label: "Original", description: "Garantizamos autenticidad" },
] as const;

export default async function HomePage() {
  const [featured, leagues] = await Promise.all([
    getFeaturedProducts(8),
    getLeagues(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-20 md:py-28">
        <div className="container-page text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto">
            Camisetas originales para
            <span className="text-primary"> tu pasión</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
            Las mejores camisetas de fútbol originales, con personalización y envío a toda Colombia.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/productos">
                Ver catálogo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#destacados">Explorar</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            🚚 Envío gratis desde $200.000
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container-page py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* League chips */}
      <section className="container-page py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Ligas destacadas</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/productos">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {leagues
            .filter((l) => l.productCount > 0)
            .map((league) => (
              <Link
                key={league.slug}
                href={`/productos?liga=${league.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/30 px-4 py-2 text-sm font-medium transition-colors"
              >
                {league.country && (
                  <span className="text-base">{league.country === "Colombia" ? "🇨🇴" : league.country === "España" ? "🇪🇸" : league.country === "Inglaterra" ? "🏴󠁧󠁢󠁥󠁮󠁧󠁿" : league.country === "Italia" ? "🇮🇹" : league.country === "Alemania" ? "🇩🇪" : "⚽"}</span>
                )}
                {league.name}
                <Badge tone="muted" size="sm">{league.productCount}</Badge>
              </Link>
            ))}
        </div>
      </section>

      {/* Featured products */}
      <section id="destacados" className="container-page pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Productos destacados</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/productos">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="container-page pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold">¿Necesitas ayuda?</h2>
          <p className="mt-2 text-muted-foreground">
            Escríbenos a WhatsApp y te asesoramos en tu compra.
          </p>
          <Button size="lg" variant="primary" className="mt-6" asChild>
            <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer">
              📱 +57 300 123 4567
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
