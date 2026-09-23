import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { SITE } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Política de privacidad y tratamiento de datos de Flashsport.",
  alternates: { canonical: `${resolvePublicOrigin()}/privacidad` },
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage title="Política de privacidad">
      <p>En {SITE.brand} tratamos los datos personales con responsabilidad y únicamente para prestar, mejorar y dar seguimiento a nuestros servicios.</p>
      <h2>1. Datos que podemos solicitar</h2>
      <p>Podemos solicitar nombre, datos de contacto, dirección de entrega e información necesaria para procesar un pedido o responder una consulta.</p>
      <h2>2. Finalidades</h2>
      <ul>
        <li>Gestionar pedidos, pagos, envíos y solicitudes de servicio.</li>
        <li>Contactarte sobre el estado de una compra o una consulta iniciada por ti.</li>
        <li>Prevenir errores, fraude y usos no autorizados de la tienda.</li>
      </ul>
      <h2>3. Compartición y conservación</h2>
      <p>Solo compartimos la información necesaria con proveedores que intervienen en el pago, la entrega o la operación técnica del servicio. Conservamos los datos durante el tiempo necesario para cumplir estas finalidades y obligaciones aplicables.</p>
      <h2>4. Consultas</h2>
      <p>Para solicitar información, actualización o atención relacionada con tus datos, escribe a <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
    </LegalDocumentPage>
  );
}
