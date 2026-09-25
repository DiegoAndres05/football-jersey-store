"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletterAction } from "@/features/newsletter/server/newsletter-actions";
import type { AdminSaveResult } from "@/shared/admin/admin-save-result";

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletterAction,
    null as AdminSaveResult | null,
  );

  return (
    <form action={formAction} className="mt-6">
      <label htmlFor="newsletter-email" className="sr-only">
        Correo electrónico
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Tu correo electrónico"
          className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
        <Button type="submit" size="lg" disabled={isPending} icon={<Mail className="h-4 w-4" />}>
          {isPending ? "Registrando..." : "Quiero recibir ofertas"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Recibirás ofertas y novedades de Flashsport. Puedes dejar de recibirlas cuando quieras.
      </p>
      {state && (
        <p className={`mt-3 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
          {state.ok ? "¡Listo! Tu correo quedó registrado." : state.error}
        </p>
      )}
    </form>
  );
}
