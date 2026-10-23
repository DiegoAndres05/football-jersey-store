"use client";

import { useFormStatus } from "react-dom";

const submitClass =
  "rounded-xl bg-primary px-4 h-10 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-60";

export function AdminPendingNotice({ label }: { label: string }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-xs rounded-2xl border border-border bg-card px-6 py-6 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">Espera un momento, no cierres esta pantalla.</p>
      </div>
    </div>
  );
}

export function AdminSubmitButton({
  label,
  pendingLabel,
  className = submitClass,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
