export const MYSTERY_BOX_SLUG = "caja-misteriosa";
export const MYSTERY_BOX_PATH = "/caja-misteriosa";
export const INTERNAL_LEAGUE_SLUG = "interno";

export type MysteryBoxTier = {
  slug: "fan" | "player" | "retro";
  level: "Básica" | "Estándar" | "Premium";
  quality: "Fan" | "Player" | "Retro";
};

const TIERS: readonly MysteryBoxTier[] = [
  { slug: "fan", level: "Básica", quality: "Fan" },
  { slug: "player", level: "Estándar", quality: "Player" },
  { slug: "retro", level: "Premium", quality: "Retro" },
];

export function mysteryBoxTiers(): readonly MysteryBoxTier[] {
  return TIERS;
}

export function mysteryBoxTier(versionSlug: string): MysteryBoxTier | null {
  return TIERS.find((tier) => tier.slug === versionSlug) ?? null;
}

export function mysteryBoxTierByQuality(quality: string): MysteryBoxTier | null {
  return TIERS.find((tier) => tier.quality === quality) ?? null;
}

export function isMysteryBoxLine(line: { lineKind?: string | null }): boolean {
  return line.lineKind === "MYSTERY_BOX";
}

export function formatPurchaseLineDetail(line: {
  lineKind?: string | null;
  teamName: string;
  versionName: string;
  sizeName: string;
  quantity?: number;
}): string {
  const size = `Talla ${line.sizeName}`;
  const qty = line.quantity != null ? ` · x${line.quantity}` : "";
  if (isMysteryBoxLine(line)) {
    const tier = mysteryBoxTierByQuality(line.versionName);
    const label = tier ? `${tier.level} · ${tier.quality}` : line.versionName;
    return `${label} · ${size}${qty}`;
  }
  return `${line.teamName} · ${line.versionName} · ${size}${qty}`;
}
