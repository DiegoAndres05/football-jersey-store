"use client";

import Link from "next/link";

export default function AdminGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6" role="alert">
      <h2 className="text-lg font-semibold">No se pudo cargar esta sección</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        La operación administrativa falló por un problema temporal. Puedes volver al panel o intentar de nuevo.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40"
        >
          Reintentar
        </button>
        <Link href="/admin" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]">
          Volver al panel
        </Link>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <p className="mt-4 text-xs text-muted-foreground">{error.message}</p>
      )}
    </div>
  );
}
