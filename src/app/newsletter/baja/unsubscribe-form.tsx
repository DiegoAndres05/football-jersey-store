"use client";

import { useActionState } from "react";
import { confirmNewsletterUnsubscribe } from "@/features/newsletter/server/campaign-actions";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    async (_previous: { ok: boolean; error?: string } | null) => confirmNewsletterUnsubscribe(token),
    null,
  );

  if (state?.ok) {
    return <p className="text-sm text-green-700">Listo. No volverás a recibir ofertas de Flashsport.</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {pending ? "Procesando…" : "Confirmar baja"}
      </button>
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
