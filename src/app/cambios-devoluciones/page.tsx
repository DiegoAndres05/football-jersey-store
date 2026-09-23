import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { SITE } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description: "Política de cambios, garantías y solicitudes de Flashsport.",
  alternates: { canonical: `${resolvePublicOrigin()}/cambios-devoluciones` },
};

export default function ReturnsPage() {
  return (
    <LegalDocumentPage title="Cambios y devoluciones">
      <p>Queremos que recibas un producto acorde con tu pedido. Si recibes una camiseta defectuosa, diferente a la comprada o con un error atribuible a {SITE.brand}, contáctanos para revisar el caso y ofrecer la solución que corresponda.</p>
      <h2>1. Cambios de talla</h2>
      <p>Podemos evaluar cambios de talla cuando la prenda esté sin uso, limpia, con sus etiquetas y en el mismo estado en que fue recibida. La disponibilidad de la nueva talla y los costos de transporte se revisan en cada caso.</p>
      <h2>2. Personalización</h2>
      <p>Las prendas personalizadas se elaboran según la información confirmada en el pedido. Por ese motivo, no se aceptan cambios por una elección incorrecta de nombre, número o talla, salvo que exista un defecto o un error de nuestra parte.</p>
      <h2>3. Caja misteriosa</h2>
      <p>La Caja misteriosa no permite elegir equipo, jugador o diseño. No se aceptan cambios por no coincidir con una preferencia que no formaba parte de la selección; sí atenderemos problemas de calidad, talla enviada incorrectamente o errores atribuibles a Flashsport.</p>
      <h2>4. Cómo solicitar atención</h2>
      <p>Escríbenos a <a href={`mailto:${SITE.email}`}>{SITE.email}</a> o por <a href="/contacto">contacto</a>, indicando el número de pedido y fotografías cuando sean necesarias para revisar el caso.</p>
      <p>Esta política no limita los derechos que correspondan al consumidor conforme a la normativa aplicable.</p>
    </LegalDocumentPage>
  );
}
