import { bestTeamMatch } from "./normalizer.ts";
import type { TeamCandidate } from "./parser.ts";
import { FKA_BASE_URL, FkaProviderError, normalizeFkaBodyPreview } from "./http.ts";

type FkaSearchPayload = {
  data?: { type?: string; name?: string; url?: string }[];
};

export function buildFkaTeamSearchUrl(query: string): string {
  return `${FKA_BASE_URL}/es/api/search.php?filter=${encodeURIComponent(query)}`;
}

export function parseFkaTeamSearchResponse(body: string, query: string, url: string): TeamCandidate | null {
  let json: FkaSearchPayload;
  try {
    json = JSON.parse(body) as FkaSearchPayload;
  } catch {
    throw new FkaProviderError("FKA_INVALID_RESPONSE", "La búsqueda de FKA no devolvió JSON válido.", {
      url,
      bodyPreview: normalizeFkaBodyPreview(body),
    });
  }

  const teams = (json.data ?? [])
    .filter((item) => item.type === "team" && Boolean(item.url) && Boolean(item.name))
    .map((item) => ({ name: item.name!, url: `${FKA_BASE_URL}${item.url}` }));

  if (teams.length === 0) return null;
  return bestTeamMatch(teams, query) ?? null;
}
