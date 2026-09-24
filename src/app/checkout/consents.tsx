"use client";

import Link from "next/link";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CheckoutFormValues } from "@/features/checkout/schemas/checkout-schema";
import type { LegalConfig } from "@/shared/config/legal";

type Props = { register: UseFormRegister<CheckoutFormValues>; errors: FieldErrors<CheckoutFormValues>; legal: LegalConfig | null };

export function CheckoutConsents({ register, errors, legal }: Props) {
  const documents = [
    ["terms", "Acepto los términos y condiciones", legal?.terms ?? { documentKey: "terms", url: "/terminos", documentVersion: "publica" }],
    ["privacy", "Acepto la política de privacidad", legal?.privacy ?? { documentKey: "privacy", url: "/privacidad", documentVersion: "publica" }],
    ["dataProcessing", "Autorizo el tratamiento de mis datos personales", legal?.dataProcessing ?? { documentKey: "dataProcessing", url: "/tratamiento-datos", documentVersion: "publica" }],
  ] as const;
  const returnsDoc = legal?.returns ?? { documentKey: "returns", url: "/cambios-devoluciones", documentVersion: "publica" };

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
              <span>
                {doc.url ? <Link href={doc.url} target={doc.url.startsWith("http") ? "_blank" : undefined} rel={doc.url.startsWith("http") ? "noopener noreferrer" : undefined} className="underline">{label}</Link> : label}
              </span>
            </label>
            {error && <p className="ml-6 text-xs text-destructive">{String(error.message || "Debes aceptar este documento.")}</p>}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        También revisa <Link href={returnsDoc.url} target={returnsDoc.url.startsWith("http") ? "_blank" : undefined} rel={returnsDoc.url.startsWith("http") ? "noopener noreferrer" : undefined} className="underline">Cambios y devoluciones</Link>.
      </p>
    </fieldset>
  );
}
