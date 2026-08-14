import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";
import { SITE, whatsappLink } from "@/shared/config/site";

const FOOTER_LINKS = [
  {
    title: "Tienda",
    links: [
      { href: "/productos", label: "Catálogo" },
      { href: "/ligas", label: "Ligas" },
      { href: "/productos?liga=la-liga", label: "La Liga" },
      { href: "/productos?liga=premier-league", label: "Premier League" },
      { href: "/productos?liga=ligue-1", label: "Ligue 1" },
    ],
  },
  {
    title: "Flashsport",
    links: [
      { href: "/sobre-nosotros", label: "Sobre nosotros" },
      { href: "/contacto", label: "Contacto" },
      { href: "/cuenta", label: "Mi cuenta" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="font-display text-3xl font-bold uppercase tracking-[0.12em]">
              {SITE.brand}
            </Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              Camisetas de fútbol · Edición 25/26
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm">
              {SITE.tagline} Camisetas de calidad con envío a toda Colombia y
              personalización con nombre y número.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                {SITE.whatsappNumber}
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {SITE.brand}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Envíos a todo el país</span>
            <span aria-hidden>·</span>
            <span>Pagos seguros</span>
            <span aria-hidden>·</span>
            <span>Productos de calidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}