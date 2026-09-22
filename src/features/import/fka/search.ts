import { bestTeamMatch, normalizeSeason } from "./normalizer.ts";
import { isKitDetailPage, type TeamCandidate } from "./parser.ts";
import { FKA_BASE_URL, FkaProviderError, normalizeFkaBodyPreview } from "./http.ts";

type FkaSearchPayload = {
  data?: { type?: string; name?: string; url?: string }[];
};

export type FkaSearchKit = { title: string; url: string };

export function buildFkaTeamSearchUrl(query: string): string {
  return `${FKA_BASE_URL}/es/api/search.php?filter=${encodeURIComponent(query)}`;
}

export function absoluteFkaSearchUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${FKA_BASE_URL}${path}`;
}

function parseSearchPayload(body: string, url: string): FkaSearchPayload {
  try {
    return JSON.parse(body) as FkaSearchPayload;
  } catch {
    throw new FkaProviderError("FKA_INVALID_RESPONSE", "La búsqueda de FKA no devolvió JSON válido.", {
      url,
      bodyPreview: normalizeFkaBodyPreview(body),
    });
  }
}

export function parseFkaTeamSearchResponse(body: string, query: string, url: string): TeamCandidate | null {
  const json = parseSearchPayload(body, url);
  const teams = (json.data ?? [])
    .filter((item) => item.type === "team" && Boolean(item.url) && Boolean(item.name))
    .map((item) => ({ name: item.name!, url: absoluteFkaSearchUrl(item.url!) }));

  if (teams.length === 0) return null;
  return bestTeamMatch(teams, query) ?? null;
}

export function parseFkaKitSearchResponse(body: string, season: string, url: string): FkaSearchKit[] {
  const json = parseSearchPayload(body, url);
  const normalized = normalizeSeason(season);
  if (!normalized) return [];
  const seen = new Set<string>();
  const kits: FkaSearchKit[] = [];
  for (const item of json.data ?? []) {
    if (!item.url || !item.name) continue;
    const href = absoluteFkaSearchUrl(item.url).split(/[?#]/)[0];
    if (!isKitDetailPage(href)) continue;
    if (!href.includes(`-${normalized}-`)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    kits.push({ title: item.name, url: href });
  }
  return kits;
}
