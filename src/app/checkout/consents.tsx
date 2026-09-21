"use client";

import Link from "next/link";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CheckoutFormValues } from "@/features/checkout/schemas/checkout-schema";
import type { LegalConfig } from "@/shared/config/legal";

type Props = { register: UseFormRegister<CheckoutFormValues>; errors: FieldErrors<CheckoutFormValues>; legal: LegalConfig | null };

export function CheckoutConsents({ register, errors, legal }: Props) {
  const documents = [
    ["terms", "Acepto los términos y condiciones", legal?.terms],
    ["privacy", "Acepto la política de privacidad", legal?.privacy],
    ["dataProcessing", "Autorizo el tratamiento de mis datos personales", legal?.dataProcessing],
  ] as const;
  return (
    <fieldset className="space-y-3" aria-describedby="consents-help">
      <legend className="font-display text-lg font-bold uppercase tracking-tight">Autorizaciones</legend>
      <p id="consents-help" className="text-xs text-muted-foreground">Son necesarias para crear tu pedido.</p>
      {documents.map(([key, label, doc]) => {
        const field = key === "terms" ? "consentTerms" : key === "privacy" ? "consentPrivacy" : "consentDataProcessing";
        const error = errors[field];
        return (
          <div key={key}>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" {...register(field)} className="mt-1 h-4 w-4" />
              <span>{doc?.url ? <Link href={doc.url} target="_blank" className="underline">{label}</Link> : label} <span className="text-muted-foreground">({doc?.documentVersion || "no configurado"})</span></span>
            </label>
            {error && <p className="ml-6 text-xs text-destructive">{String(error.message || "Debes aceptar este documento.")}</p>}
          </div>
        );
      })}
      {!legal && <p className="text-xs text-destructive">La documentación legal no está configurada.</p>}
    </fieldset>
  );
}
