import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sobre nosotros",
};

const VALUES = [
  {
    title: "Calidad",
    description:
      "Camisetas confeccionadas con materiales suaves y duraderos, revisadas una a una antes de enviarse.",
  },
  {
    title: "Disponibilidad",
    description:
      "Si no la tienes en el catálogo, la conseguimos: manejamos muchos más equipos, temporadas y ediciones retro.",
  },
  {
    title: "Atención",
    description:
      "Te acompañamos desde la elección de la talla hasta que la camiseta llega a tu puerta.",
  },
] as const;

export default function SobreNosotrosPage() {
  return (
    <div className="container-page py-8 md:py-12 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Sobre nosotros</span>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Flashsport
      </p>
      <h1 className="mt-2 font-display text-5xl md:text-6xl font-bold uppercase tracking-tight max-w-2xl">
        La camiseta que llevas puesta importa.
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
        Flashsport nació con una idea simple: que cualquier hincha pueda vestir la
        camiseta de su equipo, de la temporada que quiera — actual o retro — sin
        complicaciones y con atención de verdad.
      </p>
      <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
        Ofrecemos réplicas de calidad de camisetas de clubes y selecciones de todo el
        mundo, con personalización de nombre y número. Si no encontramos tu camiseta
        en el catálogo, la conseguimos bajo pedido.
      </p>

      <div className="mt-14 grid md:grid-cols-3 gap-4">
        {VALUES.map((value) => (
          <div key={value.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
              {value.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {value.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-border bg-card p-8 md:p-12 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight">
          ¿Listo para vestir tu pasión?
        </h2>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/productos">
            Ir al catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}