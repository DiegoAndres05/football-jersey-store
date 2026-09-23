export const SITE = {
  name: "Flashsport",
  brand: "FLASHSPORT",
  tagline: "Camisetas de fútbol para quienes viven el juego.",
  whatsappNumber: "+57 304 614 9525",
  whatsappMessage:
    "Hola Flashsport, estoy buscando una camiseta. ¿Me ayudan?",
  email: "flashsport.col@gmail.com",
  country: "Colombia",
  social: {
    instagram: "https://www.instagram.com/flashsport.col?stkn=ZDNlZDc0MzIxNw==",
    tiktok: "https://www.tiktok.com/@flashsport.col?is_from_webapp=1&sender_device=pc",
    facebook: "https://www.facebook.com/profile.php?id=61594650920339",
  },
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