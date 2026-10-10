import { prisma } from "@/lib/prisma";
import { CampaignForm } from "./campaign-form";

export const maxDuration = 60;

export default async function AdminNewsletterPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });
  const activeCount = subscribers.filter((row) => row.unsubscribedAt == null).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Newsletter</h2>
        <p className="text-sm text-muted-foreground">
          {activeCount} activos · {subscribers.length - activeCount} dados de baja
        </p>
      </div>

      <CampaignForm activeCount={activeCount} />

      {subscribers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay correos registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="p-3">Correo</th>
                <th className="p-3">Alta</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3">{row.email}</td>
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(row.subscribedAt)}
                  </td>
                  <td className="p-3 text-xs">{row.unsubscribedAt ? "De baja" : "Activo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
