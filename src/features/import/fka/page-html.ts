import type { FetchedPage } from "./parser.ts";
import { FKA_BASE_URL } from "./http.ts";

function parseAttribute(tag: string, name: string): string | null {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] ?? null;
}

function cleanHtmlText(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseAnchors(html: string, base: string): { text: string; href: string; className: string }[] {
  const anchors: { text: string; href: string; className: string }[] = [];
  const anchorRe = /<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let am: RegExpExecArray | null;
  while ((am = anchorRe.exec(html))) {
    anchors.push({
      text: cleanHtmlText(am[2]),
      href: resolveFkaUrl(am[1], base),
      className: parseAttribute(am[0], "class") ?? "",
    });
  }
  return anchors;
}

function parseBreadcrumbs(html: string, base: string): FetchedPage["breadcrumbs"] {
  const start = html.search(/class=["'][^"']*breadcrumbs?-container[^"']*["']/i);
  if (start === -1) return [];
  const nextContent = html.slice(start).search(/<main\b|<section\b|<article\b/i);
  const block = html.slice(start, nextContent > 0 ? start + nextContent : start + 5000);
  return parseAnchors(block, base).map((anchor) => ({ text: anchor.text, href: anchor.href }));
}

/** Sondeo barato: sin innerText completo ni lista de anclas. */
export const FKA_PAGE_READY_EXPRESSION = `(() => {
  const title = document.title || "";
  const isChallenge = /Un momento|Just a moment|Verificación de seguridad|Checking your browser|cf-challenge|challenge-platform/i.test(title)
    || !!document.querySelector("#challenge-running, iframe[src*='challenges.cloudflare'], .cf-turnstile");
  try { window.scrollTo(0, document.body ? document.body.scrollHeight : 0); } catch (_) {}
  return {
    ready: document.readyState,
    title,
    url: location.href,
    isChallenge,
    childCount: document.body ? document.body.childElementCount : 0,
    hasSeasonLinks: !!document.querySelector('a[href*="camisetas-20"], a[href*="-20"][href*="-kits"], a[href$="-kits/"], a[href$="-kits"]'),
    hasKitLinks: !!document.querySelector('a[href*="home-kit"], a[href*="away-kit"], a[href*="third-kit"], a[href*="camiseta-"], .archive-result, .archive-results-grid a'),
  };
})()`;

/** Extrae solo anclas de catálogo (temporada / kit), no el HTML entero. */
export const FKA_PAGE_EXTRACT_EXPRESSION = `(() => {
  try { window.scrollTo(0, document.body ? document.body.scrollHeight : 0); } catch (_) {}
  const abs = (href) => {
    try { return new URL(href, location.href).href; } catch { return href; }
  };
  const seen = new Set();
  const anchors = [];
  const push = (href, text, className) => {
    if (!href || seen.has(href)) return;
    seen.add(href);
    anchors.push({
      text: (text || "").replace(/\\s+/g, " ").trim().slice(0, 180),
      href: abs(href),
      className: className || "",
    });
  };
  const nodes = document.querySelectorAll([
    "a[href*='home-kit']",
    "a[href*='away-kit']",
    "a[href*='third-kit']",
    "a[href*='camiseta-']",
    "a[href*='-kits']",
    "a[href*='camisetas-']",
    "a.archive-result",
    ".archive-result a",
    ".archive-results-grid a",
    "[class*='archive-result']",
  ].join(","));
  for (const el of nodes) {
    const href = el.getAttribute("href") || el.getAttribute("data-href") || el.getAttribute("data-url") || (el.querySelector && el.querySelector("a[href]") ? el.querySelector("a[href]").getAttribute("href") : "");
    push(href, el.textContent, el.getAttribute("class") || "");
    if (anchors.length >= 200) break;
  }
  const crumbRoot = document.querySelector("[class*='breadcrumb']");
  const breadcrumbs = [...(crumbRoot ? crumbRoot.querySelectorAll("a[href]") : [])].slice(0, 12).map((a) => ({
    text: (a.textContent || "").replace(/\\s+/g, " ").trim(),
    href: abs(a.getAttribute("href") || ""),
  }));
  const rows = [...document.querySelectorAll("tr")].slice(0, 40).map((tr) =>
    (tr.innerText || "").replace(/\\s+/g, " ").trim(),
  ).filter(Boolean);
  const images = [...document.querySelectorAll("img")].slice(0, 24).map((img) => ({
    src: img.getAttribute("src") || "",
    dataSrc: img.getAttribute("data-src"),
  }));
  const metaImages = [...document.querySelectorAll("meta[property='og:image'], meta[name='twitter:image']")].map((meta) => ({
    property: meta.getAttribute("property"),
    name: meta.getAttribute("name"),
    content: meta.getAttribute("content") || "",
  }));
  return {
    url: location.href,
    title: document.title || "",
    anchors,
    breadcrumbs,
    rows,
    images,
    metaImages,
  };
})()`;

export function resolveFkaUrl(href: string, base: string = FKA_BASE_URL): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `${FKA_BASE_URL}${href}`;
  try {
    return new URL(href, base).toString();
  } catch {
    return `${FKA_BASE_URL}/${href}`;
  }
}

export function parseFetchedPage(html: string, url: string): FetchedPage {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? cleanHtmlText(titleMatch[1]) : "";
  const anchors = parseAnchors(html, url);

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

  return { url, title, anchors, breadcrumbs: parseBreadcrumbs(html, url), rows, images, metaImages };
}

export function normalizeImageContentType(contentType: string): string {
  return contentType.split(";")[0].trim().toLowerCase();
}
