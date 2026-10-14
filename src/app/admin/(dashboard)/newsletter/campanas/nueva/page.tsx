import { CampaignEditor } from "@/features/newsletter/components/campaign-editor";
import { loadCampaignCatalog } from "@/features/newsletter/server/campaign-catalog";
import { resolvePublicOrigin } from "@/shared/config/public-origin";

export default async function NewCampaignPage() {
  const catalog = await loadCampaignCatalog();
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
          Diseña el correo y revisa la vista previa. Todavía no se guarda ni se envía.
        </p>
      </div>
      <CampaignEditor origin={origin} images={catalog.images} destinations={catalog.destinations} />
    </div>
  );
}
