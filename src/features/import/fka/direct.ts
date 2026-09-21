import type { FetchedPage, TeamCandidate } from "./parser.ts";
import { downloadFkaImage } from "./fka-image.ts";
import {
  FKA_BASE_URL,
  FkaBlockedError,
  fetchFkaText,
  isCloudflareChallenge,
  normalizeFkaBodyPreview,
} from "./http.ts";
import { buildFkaTeamSearchUrl, parseFkaTeamSearchResponse } from "./search.ts";

/**
 * HTTP client for Football Kit Archive.
 * Catalog pages are fetched directly. No local browser or third-party API key is required.
 */
export class FkaFetcher {
  private constructor(private readonly fetchImpl?: typeof fetch) {}

  static async connect(options: { fetchImpl?: typeof fetch } = {}): Promise<FkaFetcher> {
    return new FkaFetcher(options.fetchImpl);
  }

  async fetchPage(url: string): Promise<FetchedPage> {
    const resolved = resolveUrl(url, FKA_BASE_URL);
    const html = await fetchFkaText(resolved, { fetchImpl: this.fetchImpl, kind: "document" });
    if (isCloudflareChallenge(html)) {
      throw new FkaBlockedError("Football Kit Archive respondió con verificación Cloudflare.", {
        url: resolved,
        bodyPreview: normalizeFkaBodyPreview(html),
      });
    }
    return parseHtml(html, resolved);
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
    // Direct HTTP has no browser session to close.
  }

  private async searchTeamOnce(query: string): Promise<TeamCandidate | null> {
    const searchUrl = buildFkaTeamSearchUrl(query);
    const body = await fetchFkaText(searchUrl, { fetchImpl: this.fetchImpl, kind: "xhr" });
    if (isCloudflareChallenge(body)) {
      throw new FkaBlockedError("Football Kit Archive respondió con verificación Cloudflare.", {
        url: searchUrl,
        bodyPreview: normalizeFkaBodyPreview(body),
      });
    }
    return parseFkaTeamSearchResponse(body, query, searchUrl);
  }
}

function parseAttribute(tag: string, name: string): string | null {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] ?? null;
}

function cleanHtmlText(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseAnchors(html: string): { text: string; href: string; className: string }[] {
  const anchors: { text: string; href: string; className: string }[] = [];
  const anchorRe = /<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let am: RegExpExecArray | null;
  while ((am = anchorRe.exec(html))) {
    anchors.push({
      text: cleanHtmlText(am[2]),
      href: resolveUrl(am[1], FKA_BASE_URL),
      className: parseAttribute(am[0], "class") ?? "",
    });
  }
  return anchors;
}

function parseBreadcrumbs(html: string): FetchedPage["breadcrumbs"] {
  const start = html.search(/class=["'][^"']*breadcrumbs?-container[^"']*["']/i);
  if (start === -1) return [];
  const nextContent = html.slice(start).search(/<main\b|<section\b|<article\b/i);
  const block = html.slice(start, nextContent > 0 ? start + nextContent : start + 5000);
  return parseAnchors(block).map((anchor) => ({ text: anchor.text, href: anchor.href }));
}

function parseHtml(html: string, url: string): FetchedPage {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? cleanHtmlText(titleMatch[1]) : "";
  const anchors = parseAnchors(html);

  const rows: string[] = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html))) {
    const rowText = cleanHtmlText(tr[1]);
    if (rowText) rows.push(rowText);
  }

  const images: FetchedPage["images"] = [];
  const imgRe = /<img\s[^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRe.exec(html))) {
    const tag = imgMatch[0];
    images.push({
      src: parseAttribute(tag, "src") ?? "",
      dataSrc: parseAttribute(tag, "data-src"),
    });
  }

  const metaImages: FetchedPage["metaImages"] = [];
  const metaRe = /<meta\s[^>]*>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRe.exec(html))) {
    const tag = metaMatch[0];
    const property = parseAttribute(tag, "property");
    const name = parseAttribute(tag, "name");
    const content = parseAttribute(tag, "content");
    if (content && (property === "og:image" || name === "twitter:image")) {
      metaImages.push({ property, name, content });
    }
  }

  return { url, title, anchors, breadcrumbs: parseBreadcrumbs(html), rows, images, metaImages };
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
