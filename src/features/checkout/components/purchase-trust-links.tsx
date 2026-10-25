import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { whatsappLink } from "@/shared/config/site";
import { cn } from "@/lib/utils";

function safeHref(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  const clean = url.trim();
  if (!clean || /\s/.test(clean) || /LEGAL_/i.test(clean) || /(^|[^a-z])draft([^a-z]|$)/i.test(clean)) return fallback;
  if (clean.startsWith("/") || clean.startsWith("https://")) return clean;
  return fallback;
}

const linkClass = "inline-flex min-h-11 items-center underline underline-offset-2 hover:text-foreground";

export function PurchaseTrustLinks({
  returnsHref,
  className,
}: {
  returnsHref?: string;
  className?: string;
}) {
  const returns = safeHref(returnsHref, "/cambios-devoluciones");
  const external = returns.startsWith("http");

  return (
    <ul aria-label="Información de compra" className={cn("flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}>
      <li>
        {external ? (
          <a href={returns} target="_blank" rel="noopener noreferrer" className={linkClass}>Cambios y devoluciones</a>
        ) : (
          <Link href={returns} className={linkClass}>Cambios y devoluciones</Link>
        )}
      </li>
      <li>
        <Link href="/envios" className={linkClass}>Envíos</Link>
      </li>
      <li>
        <a
          href={whatsappLink("Hola Flashsport, necesito ayuda con mi compra.")}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          WhatsApp
        </a>
      </li>
      <li className="inline-flex min-h-11 items-center gap-1">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Pagos seguros con Bold
      </li>
    </ul>
  );
}
