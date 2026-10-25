"use client";

import Link from "next/link";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { CheckoutFormValues } from "@/features/checkout/schemas/checkout-schema";
import type { LegalConfig } from "@/shared/config/legal";

function safeLegalHref(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  const clean = url.trim();
  if (!clean || /\s/.test(clean) || /LEGAL_/i.test(clean) || /(^|[^a-z])draft([^a-z]|$)/i.test(clean)) return fallback;
  if (clean.startsWith("/") || clean.startsWith("https://")) return clean;
  return fallback;
}

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  legal: LegalConfig | null;
  consentTerms: boolean;
  consentPrivacy: boolean;
};

function DocumentLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="underline"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </Link>
  );
}

export function CheckoutConsents({ register, setValue, errors, legal, consentTerms, consentPrivacy }: Props) {
  const termsHref = safeLegalHref(legal?.terms.url, "/terminos");
  const privacyHref = safeLegalHref(legal?.privacy.url, "/privacidad");
  const dataHref = safeLegalHref(legal?.dataProcessing.url, "/tratamiento-datos");
  const returnsHref = safeLegalHref(legal?.returns.url, "/cambios-devoluciones");
  const termsError = errors.consentTerms || errors.consentPrivacy;
  const dataError = errors.consentDataProcessing;

  return (
    <fieldset className="space-y-3" aria-describedby="consents-help">
      <legend className="font-display text-lg font-bold uppercase tracking-tight">Autorizaciones</legend>
      <p id="consents-help" className="text-xs text-muted-foreground">Son necesarias para crear tu pedido.</p>
      <div>
        <label htmlFor="consent-terms-privacy" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg py-1">
          <input
            id="consent-terms-privacy"
            type="checkbox"
            checked={consentTerms && consentPrivacy}
            onChange={(event) => {
              const accepted = event.target.checked;
              setValue("consentTerms", accepted, { shouldValidate: true });
              setValue("consentPrivacy", accepted, { shouldValidate: true });
            }}
            className="h-6 w-6 shrink-0"
          />
          <span className="text-sm leading-snug">
            Acepto los <DocumentLink href={termsHref}>términos y condiciones</DocumentLink>
            {" "}y la <DocumentLink href={privacyHref}>política de privacidad</DocumentLink>
          </span>
        </label>
        {termsError && <p className="text-xs text-destructive">Debes aceptar los términos y la política de privacidad.</p>}
      </div>
      <div>
        <label htmlFor="consentDataProcessing" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg py-1">
          <input id="consentDataProcessing" type="checkbox" {...register("consentDataProcessing")} className="h-6 w-6 shrink-0" />
          <span className="text-sm leading-snug">
            Autorizo el <DocumentLink href={dataHref}>tratamiento de mis datos personales</DocumentLink>
          </span>
        </label>
        {dataError && <p className="ml-9 text-xs text-destructive">{String(dataError.message || "Debes aceptar este documento.")}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        También revisa <Link href={returnsHref} target={returnsHref.startsWith("http") ? "_blank" : undefined} rel={returnsHref.startsWith("http") ? "noopener noreferrer" : undefined} className="underline">Cambios y devoluciones</Link>.
      </p>
    </fieldset>
  );
}
