"use client";

import { useState, useTransition } from "react";
import { adminFocusRing } from "../admin-ui-formatters";

export function NotificationRetryControl({ action }: { action: () => Promise<unknown> }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <div>
      <button type="button" disabled={pending} className={`${adminFocusRing} rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40 disabled:opacity-60`}
        onClick={() => {
          if (!window.confirm("¿Reintentar el aviso de este pedido?")) return;
          setMessage("");
          startTransition(async () => {
            try {
              const result = (await action()) as { status?: string; errorMessage?: string } | undefined;
              if (result?.status === "SENT" || result?.status === "ALREADY_SENT") {
                setMessage("Aviso enviado.");
              } else if (result?.status === "NOT_CONFIGURED") {
                setMessage("Telegram no está configurado en este servidor.");
              } else if (result?.status === "FAILED") {
                setMessage(result.errorMessage || "Telegram rechazó el mensaje. Revisa token y chat id.");
              } else {
                setMessage("No fue posible reintentar el aviso. Intenta de nuevo.");
              }
            } catch {
              setMessage("No fue posible reintentar el aviso. Intenta de nuevo.");
            }
          });
        }}>
        {pending ? "Reintentando…" : "Reintentar aviso"}
      </button>
      {message && <p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
