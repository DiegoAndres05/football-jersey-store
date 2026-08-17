import type { FkaKitType } from "./types";

const TYPE_ALIASES: Record<string, FkaKitType> = {
  local: "LOCAL",
  visitante: "VISITANTE",
  away: "VISITANTE",
  tercera: "TERCERA",
  third: "TERCERA",
};

const TYPE_WORDS: { word: string; type: FkaKitType }[] = [
  { word: "visitante", type: "VISITANTE" },
  { word: "tercera", type: "TERCERA" },
  { word: "local", type: "LOCAL" },
];

export function mapKitType(raw: string): FkaKitType | null {
  const key = raw.trim().toLowerCase();
  if (key in TYPE_ALIASES) return TYPE_ALIASES[key];
  const found = TYPE_WORDS.find(({ word }) => new RegExp(`\\b${word}\\b`).test(key));
  return found ? found.type : null;
}

export function normalizeSeason(raw: string): string | null {
  const trimmed = raw.trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}`;
  const short = trimmed.match(/^(\d{2})-(\d{2})$/);
  if (short) {
    const year = Number(short[1]);
    return `${year >= 70 ? 1900 + year : 2000 + year}-${short[2]}`;
  }
  return null;
}

export function seasonToYear(season: string): number | null {
  const m = normalizeSeason(season);
  if (!m) return null;
  return Number(m.slice(0, 4));
}

export function seasonSlug(season: string): string | null {
  const m = normalizeSeason(season);
  if (!m) return null;
  return `${m.slice(2, 4)}-${m.slice(5, 7)}`;
}

export function normalizeTitle(raw: string): string {
  return raw
    .replace(/\s*-\s*Football Kit Archive\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

const STRIP_TOKENS = /\b(fc|cf|club|the|de|del|a\.c\.|ac|as)\b/gi;

export function normalizeTeamName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(STRIP_TOKENS, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function teamSimilarity(a: string, b: string): number {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ta = na.split(" ").filter(Boolean);
  const tb = nb.split(" ").filter(Boolean);
  const acronymA = ta.map((t) => t[0]).join("");
  const acronymB = tb.map((t) => t[0]).join("");
  if (acronymA && acronymA === nb) return 1;
  if (acronymB && acronymB === na) return 1;
  const overlap = ta.filter((t) => tb.includes(t)).length;
  return overlap / Math.max(ta.length, tb.length);
}

export function bestTeamMatch<T extends { name: string }>(
  candidates: T[],
  query: string,
  threshold = 0.8,
): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    const score = teamSimilarity(candidate.name, query);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best && bestScore >= threshold ? best : null;
}