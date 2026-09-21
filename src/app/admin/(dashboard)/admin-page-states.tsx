import Link from "next/link";
import { AlertTriangle, ArrowLeft, Inbox } from "lucide-react";

export function AdminEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <Inbox className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="mt-4 inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function AdminErrorState({
  title,
  description,
  actionLabel = "Volver",
  actionHref = "/admin",
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <Link href={actionHref} className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdminNotFoundState({
  title,
  description,
  actionLabel = "Volver a pedidos",
  actionHref = "/admin/pedidos",
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Link href={actionHref} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {actionLabel}
      </Link>
    </div>
  );
}
