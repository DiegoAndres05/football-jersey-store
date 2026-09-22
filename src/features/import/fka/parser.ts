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

const KIT_KIND = "home|away|third";

export function parseTeamIdFromUrl(url: string): string | null {
  const m = url.split(/[?#]/)[0].match(/-(t\d+)\/?$/);
  return m ? m[1] : null;
}

export function parseSeasonFromUrl(url: string): string | null {
  const path = url.split(/[?#]/)[0];
  const modern = path.match(/-(\d{4}-\d{2})-(?:kits|(?:home|away|third)-kit)(?:\/\d+)?\/?$/i);
  if (modern) return modern[1];
  const legacy = path.match(/camisetas-(\d{4}-\d{2})-t\d+\/?$/);
  return legacy ? legacy[1] : null;
}

export function isTeamHistoryPage(url: string): boolean {
  const path = url.split(/[?#]/)[0];
  if (/camisetas-t\d+\/?$/.test(path) && !/camisetas-\d{4}-\d{2}-t\d+/.test(path)) return true;
  return /\/es\/[^/]+-kits\/?$/.test(path) && !/\d{4}-\d{2}-kits\/?$/.test(path);
}

export function isSeasonPage(url: string): boolean {
  const path = url.split(/[?#]/)[0];
  return /camisetas-\d{4}-\d{2}-t\d+\/?$/.test(path) || /-\d{4}-\d{2}-kits\/?$/.test(path);
}

export function isKitDetailPage(url: string): boolean {
  const path = url.split(/[?#]/)[0];
  if (new RegExp(`-\\d{4}-\\d{2}-(?:${KIT_KIND})-kit(?:/\\d+)?/?$`, "i").test(path)) return true;
  return /-\d{4}-\d{2}-\d+\/?$/.test(path) && /camiseta/i.test(path);
}

export function findSeasonLink(anchors: FetchedPage["anchors"], teamId: string | null, season: string): string | null {
  const normalized = normalizeSeason(season);
  if (!normalized) return null;
  const needles = [
    teamId ? `camisetas-${normalized}-${teamId}` : null,
    `-${normalized}-kits`,
    `camisetas-${normalized}-`,
  ].filter((value): value is string => Boolean(value));
  const found = anchors.find((a) => {
    const href = a.href.split(/[?#]/)[0];
    return needles.some((needle) => href.includes(needle));
  });
  return found ? found.href.split(/[?#]/)[0] : null;
}

/** Construye la URL canónica de temporada a partir de la ficha histórica del equipo. */
export function buildSeasonUrl(teamHistoryUrl: string, teamId: string | null, season: string): string | null {
  const normalized = normalizeSeason(season);
  if (!normalized) return null;
  const clean = teamHistoryUrl.split(/[?#]/)[0].replace(/\/?$/, "/");
  if (isSeasonPage(clean)) return clean;

  if (/\/es\/[^/]+-kits\/$/.test(clean) && !/\d{4}-\d{2}-kits\/$/.test(clean)) {
    return clean.replace(/-kits\/$/, `-${normalized}-kits/`);
  }
  if (teamId && new RegExp(`camisetas-${teamId}/?$`).test(clean)) {
    const next = clean.replace(/camisetas-t\d+\/$/, `camisetas-${normalized}-${teamId}/`);
    return next === clean ? null : next;
  }
  return null;
}

const NON_JERSEY_WORDS =
  /calentamiento|himno|chandal|pista|abrigo|chaqueta|campera|portero|guante|bufanda|pelota|botas|shorts|medias|sudader|parka|anorak/i;

function isKitClass(className: string): boolean {
  return /(^|\s)kit(\s|$)/i.test(className) || /archive-result/i.test(className);
}

export function extractKitLinks(
  anchors: FetchedPage["anchors"],
  season: string,
): { title: string; url: string; type: FkaKitType }[] {
  const normalized = normalizeSeason(season);
  if (!normalized) return [];
  const seen = new Set<string>();
  const links: { title: string; url: string; type: FkaKitType }[] = [];
  for (const a of anchors) {
    const href = a.href.split(/[?#]/)[0];
    if (!isKitClass(a.className) && !isKitDetailPage(href)) continue;
    if (!href.includes(`-${normalized}-`)) continue;
    const title = a.text.replace(/\s+/g, " ").trim();
    const blob = `${title} ${href}`;
    if (NON_JERSEY_WORDS.test(blob)) continue;
    const type = mapKitType(title) ?? mapKitType(href.replace(/[-/_]/g, " "));
    if (!type) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    links.push({
      title: title || href,
      url: href,
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
    if (!/camisetas-t\d+\/?$/.test(href) && !(/\/es\/[^/]+-kits\/?$/.test(href) && !/\d{4}-\d{2}-kits\/?$/.test(href))) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    teams.push({ name: a.text.replace(/\s+/g, " ").trim(), url: href });
  }
  return teams;
}

export function extractTeamContext(page: FetchedPage): FkaTeamContext {
  const breadcrumbs = page.breadcrumbs ?? [];
  const leagueIndex = breadcrumbs.findIndex((crumb) =>
    /\/es\/[^/]+-(?:camisetas|kits)-l\d+\/?$/.test(crumb.href),
  );
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
  const modern = url.match(/\/([a-z0-9-]+)-(\d{4}-\d{2})-(?:home|away|third)-kit/i);
  if (modern) return `${modern[1]}-${modern[2]}`;
  const m = url.match(/\/([a-z0-9-]+)-(\d{4}-\d{2})-(\d+)\/?$/);
  return m ? `${m[1]}-${m[2]}` : "";
}

export function parseKitDetail(page: FetchedPage): Omit<FkaKit, "source"> | null {
  const team = rowValue(page.rows, "Equipo");
  const rawSeason = rowValue(page.rows, "Temporada");
  const rawType = rowValue(page.rows, "Tipo");
  const season = rawSeason ? normalizeSeason(rawSeason) : parseSeasonFromUrl(page.url);
  const type =
    (rawType ? mapKitType(rawType) : null) ??
    mapKitType(page.title) ??
    mapKitType(page.url.replace(/[-/_]/g, " "));
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