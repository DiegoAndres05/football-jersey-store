import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SITE, whatsappLink } from "@/shared/config/site";
import { LegalLinks } from "@/shared/ui/legal-links";
import { FlashMark } from "@/components/layout/flash-mark";

const NAV_LINKS = [
  { href: "/productos", label: "Tienda (Catálogo)" },
  { href: "/ligas", label: "Ligas" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

const SOCIAL_LINKS = [
  { label: "Instagram", handle: "flashsport.col", href: SITE.social.instagram },
  { label: "TikTok", handle: "@flashsport.col", href: SITE.social.tiktok },
  { label: "Facebook", handle: "Flashsport", href: SITE.social.facebook },
] as const;

export function Footer() {
  return (
    <footer className="mt-10 bg-[#faf9f7] pb-28 lg:pb-12">
      <div className="container-page">
        <div className="rounded-[24px] border border-[#ece8e3] bg-white px-6 py-7 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link href="/" aria-label={SITE.brand}>
                <FlashMark />
              </Link>
              <p className="mt-3 max-w-[240px] text-[13px] leading-[1.45] text-[#6f6b66]">
                Curaduría y venta de camisetas de fútbol, piezas retro de colección y
                ediciones de partido con envíos asegurados a toda Colombia.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#171717]">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                100% Autenticidad Garantizada
              </p>
            </div>
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] [font-family:var(--font-ui-heavy),var(--font-sans)]">Navegación</p>
              <ul className="mt-3 space-y-2 text-[14px] text-[#4a4743]">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] [font-family:var(--font-ui-heavy),var(--font-sans)]">Medios de pago & envíos</p>
              <p className="mt-3 text-[13px] text-[#6f6b66]">Transacciones encriptadas y seguras:</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["PSE", "Nequi", "Bancolombia", "Tarjetas"].map((method) => (
                  <span key={method} className="rounded-md bg-[#f3f1ed] px-2 py-1 text-[11px] font-semibold text-[#4a4743]">
                    {method}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-snug text-[#6f6b66]">
                Operado por Servientrega & Interrapidísimo.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] [font-family:var(--font-ui-heavy),var(--font-sans)]">Contacto directo</p>
              <p className="mt-3 text-[14px] font-extrabold [font-family:var(--font-ui-heavy),var(--font-sans)]">Cartagena, Colombia</p>
              <p className="mt-2 text-[13.5px] text-[#4a4743]">
                WhatsApp:{" "}
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="font-extrabold [font-family:var(--font-ui-heavy),var(--font-sans)]">
                  {SITE.whatsappNumber}
                </a>
              </p>
              <p className="mt-1 text-[13.5px] text-[#4a4743]">
                Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </p>
              <nav aria-label="Redes sociales" className="mt-3 flex flex-wrap gap-x-3 text-[13.5px] text-[#4a4743]">
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-[#eeeae5] pt-4 text-[12.5px] text-[#8a857f] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {SITE.brand} Colombia. Todos los derechos reservados.</p>
            <LegalLinks />
          </div>
        </div>
      </div>
    </footer>
  );
}