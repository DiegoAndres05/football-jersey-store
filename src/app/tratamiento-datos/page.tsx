import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { SITE } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Tratamiento de datos personales",
  description: "Información sobre autorización y tratamiento de datos personales en Flashsport.",
  alternates: { canonical: `${resolvePublicOrigin()}/tratamiento-datos` },
};

export default function DataProcessingPage() {
  return (
    <LegalDocumentPage title="Tratamiento de datos personales">
      <p>Al realizar una compra o solicitar atención, autorizas a {SITE.brand} para tratar los datos necesarios para gestionar tu solicitud, siempre de acuerdo con la finalidad informada.</p>
      <h2>Finalidades autorizadas</h2>
      <ul>
        <li>Procesar pedidos, pagos, entregas y solicitudes de garantía.</li>
        <li>Contactarte para confirmar información o resolver novedades del servicio.</li>
        <li>Atender solicitudes relacionadas con tus derechos sobre los datos personales.</li>
      </ul>
      <h2>Tus derechos</h2>
      <p>Puedes solicitar consulta, actualización, corrección o retiro de la autorización cuando sea procedente, escribiendo a <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. Algunas obligaciones legales o contractuales pueden requerir conservar determinada información.</p>
    </LegalDocumentPage>
  );
}
