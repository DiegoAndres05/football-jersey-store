"use client";

import Link from "next/link";

export default function ProductosErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-card p-6 space-y-3">
      <h2 className="font-display text-sm font-bold uppercase tracking-tight text-destructive">
        No se pudo completar la operación
      </h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40 transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/admin"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40 transition-colors"
        >
          Volver al panel
        </Link>
      </div>
    </div>
  );
}
