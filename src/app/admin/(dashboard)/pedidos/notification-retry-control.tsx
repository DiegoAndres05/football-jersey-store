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
            try { await action(); setMessage("Aviso enviado o en proceso."); }
            catch { setMessage("No fue posible reintentar el aviso. Intenta de nuevo."); }
          });
        }}>
        {pending ? "Reintentando…" : "Reintentar aviso"}
      </button>
      {message && <p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
