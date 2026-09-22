import { parseTeamIdFromUrl, type FetchedPage, type TeamCandidate } from "./parser.ts";
import {
  assertAllowedFkaImageUrl,
  fkaImageExtension,
  MAX_FKA_IMAGE_BYTES,
  FkaImageError,
} from "./fka-image.ts";
import { FKA_BASE_URL, FkaBlockedError, FkaProviderError, isCloudflareChallenge, normalizeFkaBodyPreview } from "./http.ts";
import { buildFkaTeamSearchUrl, parseFkaTeamSearchResponse } from "./search.ts";
import { openFkaBrowser, readFkaBrowserEnv, type FkaBrowserEnv, type FkaBrowserHandle } from "./browser-provider.ts";
import { CdpSession, openCdpWebSocket } from "./cdp-session.ts";
import {
  FKA_PAGE_EXTRACT_EXPRESSION,
  FKA_PAGE_READY_EXPRESSION,
  normalizeImageContentType,
  resolveFkaUrl,
} from "./page-html.ts";

const CONTENT_WAIT_MS = 12000;
const CLOUDFLARE_WAIT_MS = 120000;

type FkaPageReady = {
  ready: string;
  title: string;
  url: string;
  isChallenge: boolean;
  childCount: number;
  hasSeasonLinks: boolean;
  hasKitLinks: boolean;
};

export class FkaFetcher {
  private session: CdpSession | null = null;
  private browser: FkaBrowserHandle | null = null;
  private cdpSessionId: string | null = null;

  private constructor() {}

  static async connect(env: FkaBrowserEnv = readFkaBrowserEnv()): Promise<FkaFetcher> {
    const fetcher = new FkaFetcher();
    try {
      fetcher.browser = await openFkaBrowser(env);
      const ws = await openCdpWebSocket(fetcher.browser.webSocketUrl);
      fetcher.session = new CdpSession(ws);
      fetcher.cdpSessionId = await attachPageSession(fetcher.session, fetcher.browser.transport);
      await fetcher.session.send("Page.enable", {}, fetcher.cdpSessionId);
      await fetcher.session.send("Runtime.enable", {}, fetcher.cdpSessionId);
      await fetcher.session.send("Page.navigate", { url: FKA_BASE_URL }, fetcher.cdpSessionId);
      await fetcher.waitForFetchedPage(FKA_BASE_URL);
      return fetcher;
    } catch (err) {
      await fetcher.close();
      throw err;
    }
  }

  async fetchPage(url: string): Promise<FetchedPage> {
    const resolved = resolveFkaUrl(url, FKA_BASE_URL);
    if (!this.session) throw new FkaBlockedError("Navegador FKA/CDP no inicializado.", { url: resolved });
    try {
      await this.session.send("Page.navigate", { url: resolved }, this.cdpSessionId);
      return this.waitForFetchedPage(resolved);
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
    }>(imageFetchExpression(url), true, this.cdpSessionId);

    if (!result?.ok) {
      throw new FkaImageError(
        result?.error
          ? `No se pudo descargar la imagen desde el navegador: ${result.error}`
          : `La imagen respondió con estado HTTP ${result?.status ?? 0}.`,
      );
    }
    const contentType = normalizeImageContentType(result.contentType);
    const extension = fkaImageExtension(contentType);
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
      contentType,
      extension,
    };
  }

  async close(): Promise<void> {
    this.session?.close();
    this.session = null;
    const browser = this.browser;
    this.browser = null;
    this.cdpSessionId = null;
    await browser?.close();
  }

  private async waitForFetchedPage(url: string): Promise<FetchedPage> {
    if (!this.session) throw new Error("Fetcher no conectado.");
    const started = Date.now();
    const deadline = started + CONTENT_WAIT_MS + CLOUDFLARE_WAIT_MS;
    const wantsSeasonLinks = /camisetas-t\d+\/?$/.test(url) && !/camisetas-\d{4}-\d{2}-t\d+/.test(url);
    const wantsKitLinks = /camisetas-\d{4}-\d{2}-t\d+\/?$/.test(url);
    let contentStarted: number | null = null;
    let lastReady: FkaPageReady | null = null;

    while (Date.now() < deadline) {
      let state: FkaPageReady | null = null;
      try {
        state = await this.session.evaluate<FkaPageReady>(
          FKA_PAGE_READY_EXPRESSION,
          false,
          this.cdpSessionId,
        );
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      if (!state) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      lastReady = state;
      const challenged = state.isChallenge || isCloudflareChallenge(state.title);
      if (challenged) {
        contentStarted = null;
        if (Date.now() - started >= CLOUDFLARE_WAIT_MS) {
          throw new FkaBlockedError("Football Kit Archive respondió con verificación Cloudflare.", {
            url,
            finalUrl: state.url,
            bodyPreview: normalizeFkaBodyPreview(state.title),
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      if (contentStarted === null) contentStarted = Date.now();
      const waited = Date.now() - contentStarted;
      const catalogReady = !wantsSeasonLinks || state.hasSeasonLinks;
      const kitsReady = !wantsKitLinks || state.hasKitLinks;
      const hasDom = state.childCount > 0 || state.ready === "complete" || state.ready === "interactive";
      const giveUpWaiting = waited >= CONTENT_WAIT_MS;

      if (hasDom && ((catalogReady && kitsReady) || giveUpWaiting)) {
        return this.extractFetchedPage(url);
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    if (lastReady && !lastReady.isChallenge && !isCloudflareChallenge(lastReady.title)) {
      return this.extractFetchedPage(url);
    }
    throw new FkaProviderError("FKA_TIMEOUT", "Tiempo de espera agotado al cargar una página de FKA.", { url });
  }

  private async extractFetchedPage(fallbackUrl: string): Promise<FetchedPage> {
    if (!this.session) throw new Error("Fetcher no conectado.");
    try {
      const page = await this.session.evaluate<FetchedPage>(
        FKA_PAGE_EXTRACT_EXPRESSION,
        false,
        this.cdpSessionId,
      );
      if (!page) {
        return emptyFetchedPage(fallbackUrl);
      }
      const pageUrl = parseTeamIdFromUrl(page.url) ? page.url : fallbackUrl;
      return { ...page, url: pageUrl, anchors: page.anchors ?? [], rows: page.rows ?? [], images: page.images ?? [] };
    } catch {
      return emptyFetchedPage(fallbackUrl);
    }
  }

  private async searchTeamOnce(query: string): Promise<TeamCandidate | null> {
    const searchUrl = buildFkaTeamSearchUrl(query);
    if (!this.session) throw new Error("Fetcher no conectado.");
    const started = Date.now();
    while (Date.now() - started < CLOUDFLARE_WAIT_MS) {
      try {
        const body = await this.session.evaluate<string>(
          `(async () => {
            const res = await fetch("/es/api/search.php?filter=" + encodeURIComponent(${JSON.stringify(query)}), {
              credentials: "include",
            });
            return await res.text();
          })()`,
          true,
          this.cdpSessionId,
        );
        if (isCloudflareChallenge(body)) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        return parseFkaTeamSearchResponse(body, query, searchUrl);
      } catch (err) {
        if (err instanceof FkaProviderError && err.code !== "FKA_INVALID_RESPONSE") throw err;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    throw new FkaBlockedError("Football Kit Archive respondió con verificación Cloudflare.", {
      url: searchUrl,
    });
  }
}

function emptyFetchedPage(url: string): FetchedPage {
  return { url, title: "", anchors: [], breadcrumbs: [], rows: [], images: [], metaImages: [] };
}

async function attachPageSession(session: CdpSession, transport: FkaBrowserHandle["transport"]): Promise<string | null> {
  if (transport === "page") return null;

  const listed = await session.send("Target.getTargets");
  const existingPage = listed.result?.targetInfos?.find((target) => target.type === "page");
  const targetId =
    existingPage?.targetId ??
    (await session.send("Target.createTarget", { url: "about:blank" })).result?.targetId;
  if (!targetId) {
    throw new FkaProviderError("FKA_NETWORK_ERROR", "El navegador remoto no creó una pestaña CDP.");
  }
  const attached = await session.send("Target.attachToTarget", { targetId, flatten: true });
  const sessionId = attached.result?.sessionId;
  if (!sessionId) {
    throw new FkaProviderError("FKA_NETWORK_ERROR", "El navegador remoto no adjuntó una pestaña CDP.");
  }
  return sessionId;
}

function imageFetchExpression(url: string): string {
  return `(async () => {
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
  })()`;
}
