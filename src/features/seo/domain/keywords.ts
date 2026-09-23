export const SITE_KEYWORDS = [
  "camisetas de fútbol",
  "camisetas fútbol Colombia",
  "camisetas de equipos",
  "camisetas de fútbol originales y réplicas",
  "camisetas de fútbol personalizadas",
  "comprar camisetas de fútbol",
  "tienda de camisetas de fútbol",
] as const;

export function appendKeywords(...keywords: string[]): string[] {
  return [...new Set([...SITE_KEYWORDS, ...keywords])];
}
