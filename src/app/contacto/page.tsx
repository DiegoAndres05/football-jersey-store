import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE, whatsappLink } from "@/shared/config/site";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { INDEXABLE } from "@/features/seo/domain/robots-policy";
import { appendKeywords } from "@/features/seo/domain/keywords";
import { NewsletterForm } from "@/features/newsletter/components/newsletter-form";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a Flashsport por WhatsApp o correo para pedidos, dudas de tallas y envíos.",
  keywords: appendKeywords(
    "contacto tienda camisetas de fútbol",
    "tallas camisetas de fútbol",
    "envíos de camisetas de fútbol",
  ),
  robots: INDEXABLE,
  alternates: { canonical: `${resolvePublicOrigin()}/contacto` },
};

export default function ContactoPage() {
  return (
    <div className="container-page py-8 md:py-12 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Contacto</span>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Hablemos
      </p>
      <h1 className="mt-2 font-display text-5xl md:text-6xl font-bold uppercase tracking-tight">
        Contacto
      </h1>
      <p className="mt-4 text-muted-foreground max-w-xl leading-relaxed">
        ¿Tienes dudas sobre tallas, envíos o personalización? Escríbenos y te
        respondemos lo antes posible.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            Atención por WhatsApp
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
            El canal más rápido para pedir camisetas que no encuentras, confirmar tallas
            y hacer seguimiento de tu pedido.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 fill-current"
              >
                <path d="M12 2a9.9 9.9 0 0 0-8.55 14.9L2 22l5.27-1.38A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.29-.17-3.13.82.84-3.05-.19-.31A8 8 0 1 1 12 20Zm4.39-5.87c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.55.12-.16.24-.63.78-.77.94-.14.16-.28.18-.52.06a6.57 6.57 0 0 1-1.93-1.19 7.28 7.28 0 0 1-1.34-1.66c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.31-.75-1.8-.2-.47-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.11.16 1.53.1.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
              </svg>
              Asesor
            </a>
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            Correo
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
            Para temas de pedidos, proveedores o prensa.
          </p>
          <a
            href={`mailto:${SITE.email}`}
            className="mt-5 inline-flex items-center gap-2 text-lg font-medium hover:underline underline-offset-4"
          >
            <Mail className="h-5 w-5" />
            {SITE.email}
          </a>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 md:col-span-2 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Ofertas en tu correo
        </p>
        <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
          No te pierdas ninguna camiseta
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Déjanos tu correo y te avisaremos de descuentos, lanzamientos y novedades de Flashsport.
        </p>
        <NewsletterForm />
      </div>
    </div>
    </div>
  );
}