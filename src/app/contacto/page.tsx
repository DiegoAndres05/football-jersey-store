import Link from "next/link";
import { ChevronRight, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE, whatsappLink } from "@/shared/config/site";

export const metadata = {
  title: "Contacto",
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

      <div className="mt-12 rounded-2xl border border-border bg-card p-8 md:p-12">
        <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
          Atención por WhatsApp
        </h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
          El canal más rápido para pedir camisetas que no encuentras, confirmar tallas
          y hacer seguimiento de tu pedido.
        </p>
        <Button size="lg" className="mt-6" asChild>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" />
            {SITE.whatsappNumber}
          </a>
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-8 md:p-12">
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
    </div>
  );
}