import { whatsappLink } from "@/shared/config/site";

/** Aviso de reposición por WhatsApp. No hay backend: el enlace abre wa.me. */
export function restockAlertHref(productName: string, sizeName?: string): string {
  const name = productName.trim();
  const size = sizeName?.trim();
  const message = size
    ? `Hola Flashsport, avísenme cuando vuelva la talla ${size} de ${name}.`
    : `Hola Flashsport, avísenme cuando vuelva a estar disponible ${name}.`;
  return whatsappLink(message);
}
