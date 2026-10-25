"use client";

import Link from "next/link";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CheckoutFormValues } from "@/features/checkout/schemas/checkout-schema";
import type { LegalConfig } from "@/shared/config/legal";

function safeLegalHref(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  const clean = url.trim();
  if (!clean || /\s/.test(clean) || /LEGAL_/i.test(clean) || /(^|[^a-z])draft([^a-z]|$)/i.test(clean)) return fallback;
  if (clean.startsWith("/") || clean.startsWith("https://")) return clean;
  return fallback;
}

type Props = { register: UseFormRegister<CheckoutFormValues>; errors: FieldErrors<CheckoutFormValues>; legal: LegalConfig | null };

export function CheckoutConsents({ register, errors, legal }: Props) {
  const documents = [
    ["terms", "Acepto los términos y condiciones", safeLegalHref(legal?.terms.url, "/terminos")],
    ["privacy", "Acepto la política de privacidad", safeLegalHref(legal?.privacy.url, "/privacidad")],
    ["dataProcessing", "Autorizo el tratamiento de mis datos personales", safeLegalHref(legal?.dataProcessing.url, "/tratamiento-datos")],
  ] as const;
  const returnsHref = safeLegalHref(legal?.returns.url, "/cambios-devoluciones");

  return (
    <fieldset className="space-y-3" aria-describedby="consents-help">
      <legend className="font-display text-lg font-bold uppercase tracking-tight">Autorizaciones</legend>
      <p id="consents-help" className="text-xs text-muted-foreground">Son necesarias para crear tu pedido.</p>
      {documents.map(([key, label, href]) => {
        const field = key === "terms" ? "consentTerms" : key === "privacy" ? "consentPrivacy" : "consentDataProcessing";
        const error = errors[field];
        return (
          <div key={key}>
            <label className="flex min-h-11 items-center gap-1 text-sm">
              <span className="-ml-3 flex h-11 w-11 shrink-0 items-center justify-center">
                <input type="checkbox" {...register(field)} className="h-5 w-5" />
              </span>
              <span className="py-1">
                {href ? <Link href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="underline">{label}</Link> : label}
              </span>
            </label>
            {error && <p className="ml-9 text-xs text-destructive">{String(error.message || "Debes aceptar este documento.")}</p>}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        También revisa <Link href={returnsHref} target={returnsHref.startsWith("http") ? "_blank" : undefined} rel={returnsHref.startsWith("http") ? "noopener noreferrer" : undefined} className="underline">Cambios y devoluciones</Link>.
      </p>
    </fieldset>
  );
}
