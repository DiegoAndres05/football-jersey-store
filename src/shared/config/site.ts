export const SITE = {
  name: "Flashsport",
  brand: "FLASHSPORT",
  tagline: "Camisetas de fútbol para quienes viven el juego.",
  whatsappNumber: "+57 300 000 0000",
  whatsappMessage:
    "Hola Flashsport, estoy buscando una camiseta. ¿Me ayudan?",
  email: "hola@flashsport.co",
  country: "Colombia",
} as const;

export const SHIPPING = {
  freeThreshold: 200000,
  flatFee: 15000,
  methodName: "Nacional",
} as const;

export function shippingFee(subtotal: number): number {
  return subtotal >= SHIPPING.freeThreshold ? 0 : SHIPPING.flatFee;
}

export function whatsappLink(
  message: string = SITE.whatsappMessage,
  number: string = SITE.whatsappNumber,
): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}