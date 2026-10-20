import { prisma } from "@/lib/prisma";
import { CampaignEditor } from "@/features/newsletter/components/campaign-editor";
import { loadCampaignCatalog } from "@/features/newsletter/server/campaign-catalog";
import { resolvePublicOrigin } from "@/shared/config/public-origin";

export const maxDuration = 60;

export default async function NewCampaignPage() {
  const [catalog, activeCount] = await Promise.all([
    loadCampaignCatalog(),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);
  let origin = "https://www.flashsports.shop";
  try {
    origin = resolvePublicOrigin();
  } catch {
    origin = "https://www.flashsports.shop";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Nueva campaña</h2>
        <p className="text-sm text-muted-foreground">
          Diseña el correo, revisa la vista previa y envíalo a los suscriptores activos. El diseño no se guarda.
        </p>
      </div>
      <CampaignEditor origin={origin} images={catalog.images} destinations={catalog.destinations} activeCount={activeCount} />
    </div>
  );
}
