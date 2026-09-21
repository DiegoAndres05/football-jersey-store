import Link from "next/link";
import { getLegalConfig } from "@/shared/config/legal";

const FALLBACK_CONTACT = "/contacto";

export function getPublicLegalLinks() {
  const config = getLegalConfig();
  return {
    terms: config?.terms ?? { documentKey: "terms", documentVersion: "", url: "" },
    privacy: config?.privacy ?? { documentKey: "privacy", documentVersion: "", url: "" },
    returns: config?.returns ?? { documentKey: "returns", documentVersion: "", url: "" },
    contact: { documentKey: "contact", documentVersion: "route-v1", url: FALLBACK_CONTACT },
    configured: Boolean(config),
  };
}

export function LegalLinks({ className = "" }: { className?: string }) {
  const links = getPublicLegalLinks();
  const items = [
    ["Términos y condiciones", links.terms.url],
    ["Privacidad", links.privacy.url],
    ["Cambios y devoluciones", links.returns.url],
    ["Contacto", links.contact.url],
  ] as const;
  return (
    <nav aria-label="Información legal" className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {items.map(([label, href]) =>
        href.startsWith("https://") ? (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{label}</a>
        ) : (
          <Link key={label} href={href}>{label}</Link>
        ),
      )}
    </nav>
  );
}
