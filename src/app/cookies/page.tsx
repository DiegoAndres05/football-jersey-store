import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { SITE } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Información sobre las cookies utilizadas por Flashsport.",
};

export default function CookiesPage() {
  return (
    <LegalDocumentPage title="Política de cookies">
      <p>
        En {SITE.brand} usamos cookies y tecnologías similares para operar la tienda, recordar tus preferencias y proteger las sesiones administrativas.
      </p>
      <h2>1. Cookies esenciales</h2>
      <p>
        Son necesarias para prestar el servicio. La tienda puede guardar el carrito en tu navegador y usar la cookie <code>sale_currency</code> para recordar la moneda seleccionada. La sesión de administración usa una cookie protegida y no está disponible para compradores.
      </p>
      <h2>2. Preferencias de cookies</h2>
      <p>
        Guardamos tu elección en la cookie <code>fs_cookie_consent</code> durante 180 días. Puedes aceptar o rechazar las cookies no esenciales desde el aviso mostrado al visitar la tienda. Las cookies esenciales seguirán activas porque sin ellas no podríamos mantener las funciones básicas.
      </p>
      <h2>3. Cookies no esenciales</h2>
      <p>
        Actualmente no usamos cookies de publicidad, perfiles de seguimiento ni analítica de terceros. Si esto cambia, actualizaremos esta política y solicitaremos tu autorización antes de activarlas.
      </p>
      <h2>4. Contacto</h2>
      <p>
        Si tienes preguntas sobre el uso de cookies, escríbenos a <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </LegalDocumentPage>
  );
}
