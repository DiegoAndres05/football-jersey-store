"use client";

import { useActionState } from "react";
import { sendNewsletterCampaign, type CampaignSendResult } from "@/features/newsletter/server/campaign-actions";

export function CampaignForm({ activeCount }: { activeCount: number }) {
  const [state, action, pending] = useActionState(sendNewsletterCampaign, null as CampaignSendResult | null);

  return (
    <form action={action} className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold">Enviar oferta</h3>
      <p className="text-sm text-muted-foreground">
        Se envía a {activeCount} {activeCount === 1 ? "suscriptor activo" : "suscriptores activos"}. Cada correo incluye su enlace de baja.
      </p>
      <label className="block text-sm">
        Asunto
        <input name="subject" required maxLength={120} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
      </label>
      <label className="block text-sm">
        Mensaje
        <textarea name="body" required rows={6} maxLength={4000} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending || activeCount === 0}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        onClick={(event) => {
          if (!window.confirm("¿Enviar esta oferta a los suscriptores activos?")) event.preventDefault();
        }}
      >
        {pending ? "Enviando…" : "Enviar"}
      </button>
      {state?.ok && (
        <p className="text-sm text-green-700" role="status">
          Enviados: {state.sent}. Fallidos: {state.failed}. Omitidos por baja: {state.skipped}.
        </p>
      )}
      {state && !state.ok && <p className="text-sm text-destructive" role="status">{state.error}</p>}
    </form>
  );
}
