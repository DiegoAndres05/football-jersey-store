import "server-only";

import type { FetchedPage, TeamCandidate } from "./parser.ts";
import { bestTeamMatch } from "./normalizer.ts";
import { assertAllowedFkaImageUrl, fkaImageExtension, MAX_FKA_IMAGE_BYTES, FkaImageError } from "./fka-image.ts";

export const FKA_CDP_ENDPOINT = process.env.FKA_CDP_ENDPOINT ?? "http://127.0.0.1:9222";
export const FKA_BASE_URL = "https://www.footballkitarchive.com";

export class FkaBlockedError extends Error {
  constructor(message = "Cloudflare requiere intervención manual en el navegador FKA.") {
    super(message);
    this.name = "FkaBlockedError";
  }
}

type CdpTarget = { id: string; webSocketDebuggerUrl: string; url: string };

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
      this.pending.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 30000);
      const origResolve = resolve;
      this.pending.set(id, (msg) => {
        clearTimeout(timer);
        origResolve(msg);
      });
    });
  }

  async evaluate<T>(expression: string, awaitPromise = false): Promise<T> {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    if (res.error) throw new Error(res.error.message ?? "CDP evaluate error");
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

async function listTargets(): Promise<CdpTarget[]> {
  const res = await fetch(`${FKA_CDP_ENDPOINT}/json`);
  if (!res.ok) throw new Error("El navegador FKA (CDP) no está disponible.");
  return (await res.json()) as CdpTarget[];
}

async function createTab(): Promise<CdpTarget> {
  const res = await fetch(`${FKA_CDP_ENDPOINT}/json/new?about:blank`, { method: "PUT" });
  if (!res.ok) throw new Error("No se pudo abrir una pestaña en el navegador FKA.");
  return (await res.json()) as CdpTarget;
}

async function closeTab(targetId: string): Promise<void> {
  try {
    await fetch(`${FKA_CDP_ENDPOINT}/json/close/${targetId}`);
  } catch {
    /* noop */
  }
}

const POLL_EXPRESSION = `(() => {
  const body = document.body ? document.body.innerText : "";
  const t = document.title || "";
  const isChallenge =
    /Un momento|Just a moment|Verificación de seguridad|Checking your browser/i.test(t + " " + body.slice(0, 200));
  return { ready: document.readyState, length: body.length, isChallenge };
})()`;

async function waitForContent(session: CdpSession, timeoutMs = 40000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await session.evaluate<{ ready: string; length: number; isChallenge: boolean }>(POLL_EXPRESSION);
    if (state.isChallenge) throw new FkaBlockedError();
    if (state.ready === "complete" && state.length > 300) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Tiempo de espera agotado al cargar una página de FKA.");
}

const EXTRACT_EXPRESSION = `(() => {
  const anchors = Array.from(document.querySelectorAll("a")).map((a) => ({
    text: (a.innerText || "").replace(/\\s+/g, " ").trim(),
    href: a.href || "",
    className: typeof a.className === "string" ? a.className : "",
  }));
  const rows = Array.from(document.querySelectorAll("table tr"))
    .map((r) => (r.innerText || "").replace(/\\s+/g, " ").trim())
    .filter(Boolean);
  const images = Array.from(document.querySelectorAll("img")).map((i) => ({
    src: i.src || "",
    dataSrc: i.getAttribute("data-src"),
  }));
  return { url: location.href, title: document.title, anchors, rows, images };
})()`;

export class FkaFetcher {
  private target: CdpTarget | null = null;
  private session: CdpSession | null = null;

  static async connect(): Promise<FkaFetcher> {
    const fetcher = new FkaFetcher();
    fetcher.target = await createTab();
    const ws = new WebSocket(fetcher.target.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("No se pudo conectar con el navegador FKA."));
    });
    fetcher.session = new CdpSession(ws);
    await fetcher.session.send("Page.enable");
    await fetcher.session.send("Runtime.enable");
    await fetcher.session.send("Page.navigate", { url: FKA_BASE_URL });
    await waitForContent(fetcher.session);
    return fetcher;
  }

  async fetchPage(url: string): Promise<FetchedPage> {
    if (!this.session) throw new Error("Fetcher no conectado.");
    await this.session.send("Page.navigate", { url });
    await waitForContent(this.session);
    return this.session.evaluate<FetchedPage>(EXTRACT_EXPRESSION);
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

  /**
   * Descarga una imagen de FKA a través de la sesión autenticada del
   * navegador (el CDN devuelve 403 a requests directos). La validación
   * de host/MIME/tamaño se hace con las mismas reglas de fka-image.
   */
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

  private async searchTeamOnce(query: string): Promise<TeamCandidate | null> {
    const res = await this.session!.evaluate<{
      data?: { type: string; name: string; url: string }[];
    }>(
      `(async () => {
        try {
          const r = await fetch("/es/api/search.php?filter=" + encodeURIComponent(${JSON.stringify(query)}), {
            credentials: "include",
          });
          return await r.json();
        } catch (e) {
          return { error: String(e) };
        }
      })()`,
      true,
    );
    const teams = (res.data ?? [])
      .filter((d) => d && d.type === "team" && d.url && d.name)
      .map((d) => ({ name: d.name, url: `${FKA_BASE_URL}${d.url}` }));
    if (teams.length === 0) return null;
    return bestTeamMatch(teams, query) ?? null;
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
}