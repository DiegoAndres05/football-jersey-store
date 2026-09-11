import type { FkaKit, FkaKitType, FkaTeamContext } from "./types.ts";
import { mapKitType, normalizeSeason, normalizeTitle } from "./normalizer.ts";

export type FetchedPage = {
  url: string;
  title: string;
  anchors: { text: string; href: string; className: string }[];
  breadcrumbs?: { text: string; href: string }[];
  rows: string[];
  images: { src: string; dataSrc: string | null }[];
  metaImages?: { property: string | null; name: string | null; content: string }[];
};

export type TeamCandidate = { name: string; url: string };

export function parseTeamIdFromUrl(url: string): string | null {
  const m = url.match(/-(t\d+)\/?$/);
  return m ? m[1] : null;
}

export function parseSeasonFromUrl(url: string): string | null {
  const m = url.match(/camisetas-(\d{4}-\d{2})-t\d+\/?$/);
  return m ? m[1] : null;
}

export function isTeamHistoryPage(page: FetchedPage): boolean {
  return /camisetas-t\d+\/?$/.test(page.url) && !/camisetas-\d{4}-\d{2}-t\d+/.test(page.url);
}

export function isSeasonPage(url: string): boolean {
  return /camisetas-\d{4}-\d{2}-t\d+\/?$/.test(url);
}

export function isKitDetailPage(url: string): boolean {
  return /-\d{4}-\d{2}-\d+\/?$/.test(url) && /\/es\//.test(url);
}

export function findSeasonLink(anchors: FetchedPage["anchors"], teamId: string, season: string): string | null {
  const normalized = normalizeSeason(season);
  if (!normalized) return null;
  const target = `camisetas-${normalized}-${teamId}`;
  const found = anchors.find((a) => a.href.includes(target));
  return found ? found.href : null;
}

const NON_JERSEY_WORDS =
  /calentamiento|himno|chandal|pista|abrigo|chaqueta|campera|portero|guante|bufanda|pelota|botas|shorts|medias|sudader|parka|anorak/i;

export function extractKitLinks(
  anchors: FetchedPage["anchors"],
  season: string,
): { title: string; url: string; type: FkaKitType }[] {
  const normalized = normalizeSeason(season);
  if (!normalized) return [];
  const seen = new Set<string>();
  const links: { title: string; url: string; type: FkaKitType }[] = [];
  for (const a of anchors) {
    if (!/^kit(\s|$)/.test(a.className)) continue;
    if (!a.href.includes(`-${normalized}-`)) continue;
    const type = mapKitType(a.text);
    if (!type) continue;
    if (NON_JERSEY_WORDS.test(a.text)) continue;
    if (seen.has(a.href)) continue;
    seen.add(a.href);
    links.push({
      title: a.text.replace(/\s+/g, " ").trim(),
      url: a.href,
      type,
    });
  }
  return links;
}

export function extractTeamLinks(anchors: FetchedPage["anchors"]): TeamCandidate[] {
  const seen = new Set<string>();
  const teams: TeamCandidate[] = [];
  for (const a of anchors) {
    const href = a.href;
    if (!/camisetas-t\d+\/?$/.test(href)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    teams.push({ name: a.text.replace(/\s+/g, " ").trim(), url: href });
  }
  return teams;
}

export function extractTeamContext(page: FetchedPage): FkaTeamContext {
  const breadcrumbs = page.breadcrumbs ?? [];
  const leagueIndex = breadcrumbs.findIndex((crumb) => /\/es\/[^/]+-camisetas-l\d+\/?$/.test(crumb.href));
  if (leagueIndex === -1) {
    return { leagueName: null, leagueUrl: null, country: null };
  }

  const league = breadcrumbs[leagueIndex];
  const country = breadcrumbs[leagueIndex - 1]?.text?.trim() || null;
  return {
    leagueName: league.text.trim() || null,
    leagueUrl: league.href || null,
    country,
  };
}

function rowValue(rows: string[], label: string): string | null {
  for (const row of rows) {
    if (row.toLowerCase().startsWith(label.toLowerCase())) {
      const value = row.slice(label.length).trim();
      if (value) return value;
    }
  }
  return null;
}

function absoluteFkaUrl(src: string): string {
  return src.startsWith("http") ? src : `https://www.footballkitarchive.com${src}`;
}

function metaImage(page: FetchedPage): string | null {
  const ogImage = page.metaImages?.find((img) => img.property === "og:image")?.content;
  if (ogImage) return absoluteFkaUrl(ogImage);
  const twitterImage = page.metaImages?.find((img) => img.name === "twitter:image")?.content;
  return twitterImage ? absoluteFkaUrl(twitterImage) : null;
}

function cdnImage(page: FetchedPage, token: string): string | null {
  const socialImage = metaImage(page);
  if (socialImage) return socialImage;

  const images = page.images.filter(
    (img) => img.dataSrc && img.dataSrc.includes("/cdn/") && !img.dataSrc.includes("-small"),
  );
  const match = images.find((img) => img.dataSrc!.includes(token));
  const src = (match ?? images[0])?.dataSrc;
  if (!src) return null;
  return absoluteFkaUrl(src);
}

function kitTokenFromUrl(url: string): string {
  const m = url.match(/\/([a-z0-9-]+)-(\d{4}-\d{2})-(\d+)\/?$/);
  return m ? `${m[1]}-${m[2]}` : "";
}

export function parseKitDetail(page: FetchedPage): Omit<FkaKit, "source"> | null {
  const team = rowValue(page.rows, "Equipo");
  const rawSeason = rowValue(page.rows, "Temporada");
  const rawType = rowValue(page.rows, "Tipo");
  const season = rawSeason ? normalizeSeason(rawSeason) : parseSeasonFromUrl(page.url);
  const type = rawType ? mapKitType(rawType) : mapKitType(page.title);
  const title = normalizeTitle(page.title);

  if (!team || !season || !type) return null;

  return {
    title,
    team,
    season,
    type,
    leagueName: null,
    leagueUrl: null,
    country: null,
    imageUrl: cdnImage(page, kitTokenFromUrl(page.url)),
    sourceUrl: page.url,
  };
}