import Link from "next/link";

export default function NewsletterCampaignsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Campañas</h2>
        <p className="text-sm text-muted-foreground">
          Las campañas se diseñan y se envían en el momento. El diseño no queda guardado.
        </p>
      </div>
      <Link href="/admin/newsletter/campanas/nueva" className="inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
        Nueva campaña
      </Link>
    </div>
  );
}
