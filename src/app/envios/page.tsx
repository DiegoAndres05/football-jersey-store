import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getShippingRates } from "@/features/system/repositories/shipping-rates-repository";
import { SHIPPING, SITE, whatsappLink } from "@/shared/config/site";
import { formatMoney } from "@/shared/money/format";
import { resolvePublicOrigin } from "@/shared/config/public-origin";

const money = (amountCop: number) => formatMoney({ amountCop, currency: "COP" });

export const metadata: Metadata = {
  title: "Envíos",
  description:
    "Envíos de camisetas a toda Colombia. Conoce el costo del envío nacional y desde qué monto es gratis.",
  alternates: { canonical: `${resolvePublicOrigin()}/envios` },
};

export default async function ShippingPolicyPage() {
  const rates = await getShippingRates();

  return (
    <LegalDocumentPage title="Envíos" eyebrow="Tu pedido">
      <p>
        {SITE.brand} envía camisetas a toda Colombia. El costo que ves aquí es el mismo que calcula el carrito y el pago.
      </p>
      <h2>Costo</h2>
      <ul>
        <li>Envío nacional: {money(rates.nationalFeeCop)}.</li>
        <li>Envío gratis en pedidos desde {money(SHIPPING.freeThreshold)}.</li>
      </ul>
      <h2>Cobertura</h2>
      <p>
        La cobertura de este envío es Colombia. Si el destino es otro país, el pago te muestra la cotización disponible antes de cobrar.
      </p>
      <h2>Tiempos</h2>
      <p>
        TODO: el dueño debe confirmar los tiempos antes de tomarlos como compromiso. Hoy la tienda muestra estas estimaciones:
      </p>
      <ul>
        <li>TODO: entrega inmediata, despacho en 24–48 horas. Confirmar si son horas hábiles y desde qué momento empiezan.</li>
        <li>TODO: bajo pedido, tiempo estimado de 15–20 días. Confirmar si son días hábiles o de calendario, y si cuentan desde la compra o desde que llega la camiseta.</li>
        <li>TODO: tiempo de la transportadora dentro de Colombia después del despacho. Confirmar ciudades y excepciones.</li>
      </ul>
      <p>
        Si necesitas una fecha para un partido, escríbenos por{" "}
        <a href={whatsappLink("Hola Flashsport, quiero confirmar el tiempo de envío de mi pedido.")}>WhatsApp</a>{" "}
        o a <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </LegalDocumentPage>
  );
}
