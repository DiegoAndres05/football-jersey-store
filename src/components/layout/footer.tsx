import Link from "next/link";
import { Mail } from "lucide-react";
import { SITE, whatsappLink } from "@/shared/config/site";
import { LegalLinks } from "@/shared/ui/legal-links";

const FOOTER_LINKS = [
  {
    title: "Tienda",
    links: [
      { href: "/productos", label: "Catálogo" },
      { href: "/ligas", label: "Ligas" },
      { href: "/ligas/la-liga", label: "La Liga" },
      { href: "/ligas/premier-league", label: "Premier League" },
      { href: "/ligas/ligue-1", label: "Ligue 1" },
    ],
  },
  {
    title: "Flashsport",
    links: [
      { href: "/sobre-nosotros", label: "Sobre nosotros" },
      { href: "/cuenta", label: "Mi cuenta" },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { label: "Instagram", handle: "flashsport.col", href: SITE.social.instagram },
  { label: "TikTok", handle: "@flashsport.col", href: SITE.social.tiktok },
  { label: "Facebook", handle: "Flashsport", href: SITE.social.facebook },
] as const;

function SocialIcon({ name }: { name: (typeof SOCIAL_LINKS)[number]["label"] }) {
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
      </svg>
    );
  }

  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
        <path d="M13.5 21v-8h2.75l.4-3h-3.15V8.08c0-.87.24-1.46 1.5-1.46h1.8V3.94c-.31-.04-1.37-.14-2.6-.14-2.57 0-4.33 1.57-4.33 4.45V10H7v3h2.87v8h3.63Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
      <path d="M15.2 3h3.05c.22 1.4 1.02 2.4 2.45 2.93v3.12c-1.12-.03-2.16-.3-3.1-.8v6.18c0 3.35-2.31 5.57-5.47 5.57-3.05 0-5.18-2.02-5.18-4.85 0-2.96 2.35-5.1 5.7-5.1.25 0 .5.02.75.05v3.08a3.9 3.9 0 0 0-.75-.08c-1.1 0-2.12.75-2.12 1.92 0 .98.72 1.83 1.77 1.83 1.18 0 1.87-.88 1.87-2.34V3h4.03Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="font-display text-3xl font-bold uppercase tracking-[0.12em]">
              {SITE.brand}
            </Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              Camisetas de fútbol... ¡Bienvenidos al mundo del fútbol!
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
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                  aria-hidden="true"
                >
                  <path d="M12 2a9.8 9.8 0 0 0-8.47 14.75L2 22l5.43-1.47A9.8 9.8 0 1 0 12 2Zm0 17.6a7.77 7.77 0 0 1-3.96-1.08l-.28-.17-3.22.87.86-3.13-.18-.29A7.8 7.8 0 1 1 12 19.6Zm4.28-5.84c-.23-.12-1.36-.67-1.57-.75-.21-.08-.36-.12-.52.12-.15.23-.59.75-.72.9-.13.16-.27.18-.5.06-.23-.12-.97-.36-1.85-1.14-.68-.61-1.14-1.36-1.27-1.59-.13-.23-.01-.36.1-.48.1-.1.23-.27.35-.4.12-.14.15-.23.23-.39.08-.16.04-.3-.02-.42-.06-.12-.52-1.25-.71-1.71-.19-.45-.38-.39-.52-.4h-.45c-.16 0-.42.06-.64.3-.22.23-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.11.15 1.53.09.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.21-.16-.44-.28Z" />
                </svg>
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

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em]">
              Redes sociales
            </h4>
            <nav aria-label="Redes sociales" className="flex flex-col items-start gap-2.5">
              {SOCIAL_LINKS.map(({ label, handle, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <SocialIcon name={label} />
                  <span>{handle}</span>
                </a>
              ))}
            </nav>
          </div>
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
          <LegalLinks className="text-xs text-muted-foreground" />
        </div>
      </div>
    </footer>
  );
}