import "server-only";

import type { FetchedPage, TeamCandidate } from "./parser.ts";
import { bestTeamMatch } from "./normalizer.ts";
import { downloadFkaImage, assertAllowedFkaImageUrl, FkaImageError } from "./fka-image.ts";

export const FKA_BASE_URL = "https://www.footballkitarchive.com";
const REFERER = `${FKA_BASE_URL}/`;
const TIMEOUT_MS = 20000;

export class FkaBlockedError extends Error {
  constructor(message = "Cloudflare requiere intervención manual en el navegador FKA.") {
    super(message);
    this.name = "FkaBlockedError";
  }
}

async function fkaFetch(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Referer: REFERER,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function isCloudflareChallenge(html: string): boolean {
  return (
    /Un momento|Just a moment|Verificación de seguridad|Checking your browser/i.test(html.slice(0, 500)) ||
    /cf-challenge|challenge-platform/i.test(html.slice(0, 2000))
  );
}

function parseHtml(html: string, url: string): FetchedPage {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

  const anchors: FetchedPage["anchors"] = [];
  const anchorRe = /<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let am: RegExpExecArray | null;
  while ((am = anchorRe.exec(html))) {
    const href = am[1];
    const rawText = am[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const classMatch = am[0].match(/class=["']([^"']*)["']/i);
    anchors.push({ text: rawText, href, className: classMatch ? classMatch[1] : "" });
  }

  const rows: string[] = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html))) {
    const rowText = tr[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (rowText) rows.push(rowText);
  }

  const images: FetchedPage["images"] = [];
  const imgRe = /<img\s[^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRe.exec(html))) {
    const tag = imgMatch[0];
    const srcMatch = tag.match(/\bsrc=["']([^"']*)["']/i);
    const dataSrcMatch = tag.match(/\bdata-src=["']([^"']*)["']/i);
    images.push({
      src: srcMatch ? srcMatch[1] : "",
      dataSrc: dataSrcMatch ? dataSrcMatch[1] : null,
    });
  }

  return { url, title, anchors, rows, images };
}

function resolveUrl(href: string, base: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `${FKA_BASE_URL}${href}`;
  try {
    return new URL(href, base).toString();
  } catch {
    return `${FKA_BASE_URL}/${href}`;
  }
}

export class FkaFetcher {
  private constructor() {}

  static async connect(): Promise<FkaFetcher> {
    return new FkaFetcher();
  }

  async fetchPage(url: string): Promise<FetchedPage> {
    const html = await fkaFetch(url);
    if (isCloudflareChallenge(html)) throw new FkaBlockedError();
    return parseHtml(html, url);
  }

  async searchTeam(query: string): Promise<TeamCandidate | null> {
    const direct = await this.searchTeamOnce(query);
    if (direct) return direct;
    const compact = query.replace(/\b(fc|cf|club|the|de|del|a\.c\.|ac|as)\b/gi, " ").replace(/\s+/g, " ").trim();
    if (compact && compact.toLowerCase() !== query.toLowerCase()) {
      return this.searchTeamOnce(compact);
    }
    return null;
  }

  async downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
    return downloadFkaImage(url);
  }

  async close(): Promise<void> {
    // no-op: no CDP browser to close
  }

  private async searchTeamOnce(query: string): Promise<TeamCandidate | null> {
    try {
      const searchUrl = `${FKA_BASE_URL}/es/api/search.php?filter=${encodeURIComponent(query)}`;
      const html = await fkaFetch(searchUrl);
      const json = JSON.parse(html) as { data?: { type: string; name: string; url: string }[] };
      const teams = (json.data ?? [])
        .filter((d) => d && d.type === "team" && d.url && d.name)
        .map((d) => ({ name: d.name, url: `${FKA_BASE_URL}${d.url}` }));
      if (teams.length === 0) return null;
      return bestTeamMatch(teams, query) ?? null;
    } catch {
      return null;
    }
  }
}
