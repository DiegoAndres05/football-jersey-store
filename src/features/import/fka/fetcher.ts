import "server-only";

import type { FetchedPage, TeamCandidate } from "./parser.ts";
import {
  assertAllowedFkaImageUrl,
  fkaImageExtension,
  MAX_FKA_IMAGE_BYTES,
  FkaImageError,
} from "./fka-image.ts";
import {
  FKA_BASE_URL,
  FkaBlockedError,
  FkaProviderError,
  isCloudflareChallenge,
  normalizeFkaBodyPreview,
} from "./http.ts";
import { buildFkaTeamSearchUrl, parseFkaTeamSearchResponse } from "./search.ts";

export const FKA_CDP_ENDPOINT = process.env.FKA_CDP_ENDPOINT ?? "http://127.0.0.1:9222";
const LOAD_TIMEOUT_MS = 40000;

export type CdpTarget = { id: string; webSocketDebuggerUrl: string; url: string };

type CdpResponse = {
  id?: number;
  method?: string;
  params?: { url?: string };
  result?: { result?: { value?: unknown } };
  error?: { message?: string };
};

class CdpSession {
  private ws: WebSocket;
  private seq = 0;
  private pending = new Map<number, (msg: CdpResponse) => void>();

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(String(event.data)) as CdpResponse;
      if (msg.id && this.pending.has(msg.id)) {
        this.pending.get(msg.id)!(msg);
        this.pending.delete(msg.id);
      }
    };
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<CdpResponse> {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 30000);
      this.pending.set(id, (msg) => {
        clearTimeout(timer);
        if (msg.error) reject(new Error(msg.error.message ?? "CDP error"));
        else resolve(msg);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate<T>(expression: string, awaitPromise = false): Promise<T> {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    return (res.result?.result?.value ?? null) as T;
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* noop */
    }
  }
}

async function createTab(): Promise<CdpTarget> {
  let res: Response;
  try {
    res = await fetch(`${FKA_CDP_ENDPOINT}/json/new?about:blank`, { method: "PUT" });
  } catch (err) {
    throw new FkaProviderError(
      "FKA_NETWORK_ERROR",
      `No se pudo conectar con el navegador FKA/CDP: ${err instanceof Error ? err.message : "error de red"}`,
      { url: FKA_CDP_ENDPOINT },
    );
  }
  if (!res.ok) {
    throw new FkaProviderError("FKA_NETWORK_ERROR", "No se pudo abrir una pestaña en el navegador FKA/CDP.", {
      url: `${FKA_CDP_ENDPOINT}/json/new?about:blank`,
      status: res.status,
      statusText: res.statusText,
    });
  }
  return (await res.json()) as CdpTarget;
}

async function closeTab(targetId: string): Promise<void> {
  try {
    await fetch(`${FKA_CDP_ENDPOINT}/json/close/${targetId}`);
  } catch {
    /* noop */
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
      href: am[1],
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
  return parseAnchors(block).map((anchor) => ({ text: anchor.text, href: resolveUrl(anchor.href, FKA_BASE_URL) }));
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

const PAGE_STATE_EXPRESSION = `(() => {
  const body = document.body ? document.body.innerText : "";
  const html = document.documentElement ? document.documentElement.outerHTML : "";
  const title = document.title || "";
  const isChallenge = /Un momento|Just a moment|Verificación de seguridad|Checking your browser|cf-challenge|challenge-platform/i.test(
    title + " " + body.slice(0, 500) + " " + html.slice(0, 2000),
  );
  return { ready: document.readyState, body, html, title, url: location.href, isChallenge };
})()`;

export class FkaFetcher {
  private target: CdpTarget | null = null;
  private session: CdpSession | null = null;

  private constructor() {}

  static async connect(): Promise<FkaFetcher> {
    const fetcher = new FkaFetcher();
    fetcher.target = await createTab();
    const ws = new WebSocket(fetcher.target.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new FkaProviderError("FKA_NETWORK_ERROR", "No se pudo conectar con el navegador FKA/CDP."));
    });
    fetcher.session = new CdpSession(ws);
    await fetcher.session.send("Page.enable");
    await fetcher.session.send("Runtime.enable");
    await fetcher.session.send("Page.navigate", { url: FKA_BASE_URL });
    await fetcher.waitForContent(FKA_BASE_URL);
    return fetcher;
  }

  async fetchPage(url: string): Promise<FetchedPage> {
    const resolved = resolveUrl(url, FKA_BASE_URL);
    if (!this.session) throw new FkaBlockedError("Navegador FKA/CDP no inicializado.", { url: resolved });
    try {
      await this.session.send("Page.navigate", { url: resolved });
      const html = await this.waitForContent(resolved);
      return parseHtml(html, resolved);
    } catch (err) {
      if (err instanceof FkaProviderError) throw err;
      throw new FkaBlockedError(
        `Error al cargar la página: ${err instanceof Error ? err.message : "error desconocido"}`,
        { url: resolved },
      );
    }
  }

  async searchTeam(query: string): Promise<TeamCandidate | null> {
    if (!this.session) throw new Error("Fetcher no conectado.");
    const direct = await this.searchTeamOnce(query);
    if (direct) return direct;
    const compact = query.replace(/\b(fc|cf|club|the|de|del|a\.c\.|ac|as)\b/gi, " ").replace(/\s+/g, " ").trim();
    if (compact && compact.toLowerCase() !== query.toLowerCase()) {
      return this.searchTeamOnce(compact);
    }
    return null;
  }

  async downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
    if (!this.session) throw new Error("Fetcher no conectado.");
    assertAllowedFkaImageUrl(url);

    const result = await this.session.evaluate<{
      ok: boolean;
      status: number;
      contentType: string;
      size: number;
      base64: string | null;
      error?: string;
    }>(
      `(async () => {
        try {
          const res = await fetch(${JSON.stringify(url)}, { credentials: "include" });
          const contentType = res.headers.get("content-type") || "";
          const buf = await res.arrayBuffer();
          const bytes = new Uint8Array(buf);
          const CHUNK = 0x8000;
          const parts = [];
          for (let i = 0; i < bytes.length; i += CHUNK) {
            parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK)));
          }
          return {
            ok: res.ok,
            status: res.status,
            contentType,
            size: bytes.length,
            base64: res.ok ? btoa(parts.join("")) : null,
          };
        } catch (e) {
          return { ok: false, status: 0, contentType: "", size: 0, base64: null, error: String(e) };
        }
      })()`,
      true,
    );

    if (!result.ok) {
      throw new FkaImageError(
        result.error
          ? `No se pudo descargar la imagen desde el navegador: ${result.error}`
          : `La imagen respondió con estado HTTP ${result.status}.`,
      );
    }
    const extension = fkaImageExtension(result.contentType);
    if (!extension) {
      throw new FkaImageError("La imagen no es un formato válido (JPG, PNG o WebP).");
    }
    if (result.size === 0) {
      throw new FkaImageError("La imagen descargada está vacía.");
    }
    if (result.size > MAX_FKA_IMAGE_BYTES) {
      throw new FkaImageError("La imagen supera el tamaño máximo permitido (5 MB).");
    }
    return {
      buffer: Buffer.from(result.base64 ?? "", "base64"),
      contentType: result.contentType,
      extension,
    };
  }

  async close(): Promise<void> {
    if (this.target) {
      const targetId = this.target.id;
      this.session?.close();
      await closeTab(targetId);
    } else {
      this.session?.close();
    }
    this.target = null;
    this.session = null;
  }

  private async waitForContent(url: string): Promise<string> {
    if (!this.session) throw new Error("Fetcher no conectado.");
    const deadline = Date.now() + LOAD_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const state = await this.session.evaluate<{
        ready: string;
        body: string;
        html: string;
        title: string;
        url: string;
        isChallenge: boolean;
      }>(PAGE_STATE_EXPRESSION);
      if (state.isChallenge || isCloudflareChallenge(`${state.title} ${state.body} ${state.html}`)) {
        throw new FkaBlockedError("Football Kit Archive respondió con verificación Cloudflare.", {
          url,
          finalUrl: state.url,
          bodyPreview: normalizeFkaBodyPreview(`${state.title} ${state.body}`),
        });
      }
      if (state.ready === "complete" && state.body.length > 300) return state.html;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new FkaProviderError("FKA_TIMEOUT", "Tiempo de espera agotado al cargar una página de FKA.", { url });
  }

  private async searchTeamOnce(query: string): Promise<TeamCandidate | null> {
    try {
      const searchUrl = buildFkaTeamSearchUrl(query);
      if (!this.session) throw new Error("Fetcher no conectado.");
      const body = await this.session.evaluate<string>(
        `(async () => {
          const res = await fetch("/es/api/search.php?filter=" + encodeURIComponent(${JSON.stringify(query)}), {
            credentials: "include",
          });
          return await res.text();
        })()`,
        true,
      );
      return parseFkaTeamSearchResponse(body, query, searchUrl);
    } catch (err) {
      if (err instanceof FkaProviderError) throw err;
      return null;
    }
  }
}
