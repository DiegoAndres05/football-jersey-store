import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { SITE } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Términos y condiciones de compra de Flashsport.",
  alternates: { canonical: `${resolvePublicOrigin()}/terminos` },
};

export default function TermsPage() {
  return (
    <LegalDocumentPage title="Términos y condiciones">
      <p>Estos términos regulan el uso de {SITE.brand} y las compras realizadas a través de nuestra tienda en línea.</p>
      <h2>1. Información de los productos</h2>
      <p>Publicamos la información disponible de cada camiseta, incluyendo precio, talla, versión y disponibilidad. Las imágenes son ilustrativas y pueden existir pequeñas diferencias de color según la pantalla.</p>
      <h2>2. Pedidos y pagos</h2>
      <p>Un pedido queda sujeto a la confirmación del pago y a la disponibilidad de la variante seleccionada. Si se presenta un inconveniente con el inventario o el pago, nos comunicaremos contigo para ofrecer una solución.</p>
      <h2>3. Envíos</h2>
      <p>Realizamos envíos a Colombia. Los tiempos y costos pueden variar según la ciudad, la modalidad de entrega y si el producto se encuentra disponible para entrega inmediata o bajo pedido.</p>
      <h2>4. Atención</h2>
      <p>Para preguntas sobre un pedido, escríbenos a <a href={`mailto:${SITE.email}`}>{SITE.email}</a> o por <a href="/contacto">nuestros canales de contacto</a>.</p>
    </LegalDocumentPage>
  );
}
