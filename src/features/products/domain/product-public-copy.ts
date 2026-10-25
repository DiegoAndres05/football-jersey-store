const KIT_TYPE_LABELS: Record<string, string> = {
  LOCAL: "Local",
  VISITANTE: "Visitante",
  TERCERA: "Tercera",
  ENTRENAMIENTO: "Entrenamiento",
  ESPECIAL: "Especial",
};

export function kitTypeLabel(kitType: string): string {
  const clean = kitType.trim();
  if (!clean) return "";
  const known = KIT_TYPE_LABELS[clean.toUpperCase()];
  if (known) return known;
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

/** Evita «temporada Temporada 26/27» cuando el nombre ya incluye la palabra. */
export function seasonInSentence(name: string): string {
  const trimmed = name.trim();
  if (/^temporada\b/i.test(trimmed)) return trimmed;
  return `temporada ${trimmed}`;
}

export function productEyebrowParts(input: {
  teamName: string;
  brand?: string | null;
  leagueName?: string | null;
  seasonName: string;
}): string[] {
  return [input.teamName, input.brand, input.leagueName, input.seasonName]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0);
}

export function productFallbackDescription(input: {
  description?: string | null;
  teamName: string;
  seasonName: string;
  kitType: string;
  leagueName?: string | null;
}): string {
  const custom = input.description?.trim();
  if (custom) return custom;
  const kit = kitTypeLabel(input.kitType);
  const league = input.leagueName?.trim() ? ` Liga: ${input.leagueName.trim()}.` : "";
  const typeSentence = kit ? ` Tipo: ${kit}.` : "";
  return `Camiseta de fútbol de ${input.teamName}, ${seasonInSentence(input.seasonName)}.${typeSentence}${league}`;
}
