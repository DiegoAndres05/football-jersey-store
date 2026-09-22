import { FkaProviderError } from "./http.ts";

export type FkaCdpTransport = "page" | "browser";

export type FkaBrowserHandle = {
  webSocketUrl: string;
  transport: FkaCdpTransport;
  close: () => Promise<void>;
};

export type FkaBrowserEnv = {
  endpoint?: string | null;
  token?: string | null;
  browserbaseProjectId?: string | null;
  nodeEnv?: string | null;
  fetchImpl?: typeof fetch;
};

const BROWSERBASE_API_URL = "https://api.browserbase.com/v1/sessions";

export function readFkaBrowserEnv(): FkaBrowserEnv {
  return {
    endpoint: emptyToNull(process.env.FKA_CDP_ENDPOINT),
    token:
      emptyToNull(process.env.FKA_CDP_TOKEN) ??
      emptyToNull(process.env.FKA_BROWSERBASE_API_KEY) ??
      emptyToNull(process.env.BROWSERBASE_API_KEY),
    browserbaseProjectId:
      emptyToNull(process.env.FKA_BROWSERBASE_PROJECT_ID) ?? emptyToNull(process.env.BROWSERBASE_PROJECT_ID),
    nodeEnv: emptyToNull(process.env.NODE_ENV),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/^['"]|['"]$/g, "");
  return trimmed ? trimmed : null;
}

export function describeFkaBrowserMode(env: FkaBrowserEnv = readFkaBrowserEnv()): "local-devtools" | "websocket" | "browserbase" {
  const endpoint = env.endpoint ?? "";
  if (/^wss?:\/\//i.test(endpoint)) return "websocket";
  const isHttpDevtools = /^https?:\/\//i.test(endpoint) && !/browserbase\.com/i.test(endpoint);
  const isLoopback = /\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/i.test(endpoint);
  if (isHttpDevtools && !(isLoopback && env.nodeEnv === "production")) return "local-devtools";
  return "browserbase";
}

export async function openFkaBrowser(env: FkaBrowserEnv = readFkaBrowserEnv()): Promise<FkaBrowserHandle> {
  const mode = describeFkaBrowserMode(env);
  if (mode === "local-devtools") return openLocalDevtools(env.endpoint!);
  if (mode === "websocket") return openDirectWebsocket(env.endpoint!, env.token);
  return openBrowserbaseSession(env);
}

async function openLocalDevtools(endpoint: string): Promise<FkaBrowserHandle> {
  const base = endpoint.replace(/\/$/, "");
  const newUrl = `${base}/json/new?about:blank`;
  let res: Response;
  try {
    res = await fetch(newUrl, { method: "PUT" });
    if (res.status === 405 || res.status === 404) {
      res = await fetch(newUrl);
    }
  } catch (err) {
    throw new FkaProviderError(
      "FKA_NETWORK_ERROR",
      `No se pudo conectar con el navegador FKA/CDP: ${err instanceof Error ? err.message : "error de red"}`,
      { url: base, reason: "conexión rechazada" },
    );
  }
  if (!res.ok) {
    throw new FkaProviderError("FKA_NETWORK_ERROR", "No se pudo abrir una pestaña en el navegador FKA/CDP.", {
      url: newUrl,
      status: res.status,
      statusText: res.statusText,
    });
  }
  const target = (await res.json()) as { id?: string; webSocketDebuggerUrl?: string };
  if (!target.webSocketDebuggerUrl) {
    throw new FkaProviderError("FKA_NETWORK_ERROR", "El navegador FKA/CDP no devolvió webSocketDebuggerUrl.", {
      url: newUrl,
    });
  }
  const targetId = target.id;
  return {
    webSocketUrl: target.webSocketDebuggerUrl,
    transport: "page",
    close: async () => {
      if (!targetId) return;
      try {
        await fetch(`${base}/json/close/${encodeURIComponent(targetId)}`);
      } catch {
        /* noop */
      }
    },
  };
}

function openDirectWebsocket(endpoint: string, token: string | null | undefined): Promise<FkaBrowserHandle> {
  let url = endpoint;
  if (token && !/[?&]token=/.test(url)) {
    url += (url.includes("?") ? "&" : "?") + `token=${encodeURIComponent(token)}`;
  }
  return Promise.resolve({
    webSocketUrl: url,
    transport: "browser",
    close: async () => undefined,
  });
}

async function openBrowserbaseSession(env: FkaBrowserEnv): Promise<FkaBrowserHandle> {
  if (!env.token) {
    throw new FkaProviderError(
      "FKA_NETWORK_ERROR",
      "No hay un navegador FKA configurado. Define FKA_CDP_ENDPOINT (CDP local o wss) o FKA_CDP_TOKEN + FKA_BROWSERBASE_PROJECT_ID.",
      { reason: "navegador remoto" },
    );
  }
  if (!env.browserbaseProjectId) {
    throw new FkaProviderError(
      "FKA_NETWORK_ERROR",
      "Falta FKA_BROWSERBASE_PROJECT_ID para el navegador remoto.",
      { reason: "navegador remoto" },
    );
  }
  const fetchImpl = env.fetchImpl ?? fetch;
  let res: Response | null = null;
  try {
    for (const payload of browserbaseSessionPayloads(env.browserbaseProjectId)) {
      res = await fetchImpl(BROWSERBASE_API_URL, {
        method: "POST",
        headers: {
          "X-BB-API-Key": env.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok || !shouldRetryBrowserbasePayload(res.status)) break;
    }
  } catch (err) {
    throw new FkaProviderError(
      "FKA_NETWORK_ERROR",
      `No se pudo conectar con el proveedor del navegador FKA: ${err instanceof Error ? err.message : "error de red"}`,
      { url: BROWSERBASE_API_URL },
    );
  }
  if (!res || !res.ok) {
    const status = res?.status;
    const message =
      status === 401
        ? "El navegador remoto rechazó la API key. Revisa FKA_CDP_TOKEN (API key de Browserbase)."
        : status === 403
          ? "El navegador remoto no permite esta sesión (HTTP 403). Revisa que FKA_BROWSERBASE_PROJECT_ID sea el del mismo proyecto que la API key, o que el plan permita crear sesiones."
          : "No se pudo crear la sesión del navegador remoto.";
    throw new FkaProviderError("FKA_NETWORK_ERROR", message, {
      url: BROWSERBASE_API_URL,
      status,
      statusText: res?.statusText,
      reason: "navegador remoto",
    });
  }
  const session = (await res.json()) as { id?: string; connectUrl?: string };
  if (!session.id || !session.connectUrl) {
    throw new FkaProviderError("FKA_NETWORK_ERROR", "El proveedor del navegador FKA devolvió una sesión inválida.", {
      url: BROWSERBASE_API_URL,
    });
  }
  const sessionId = session.id;
  const token = env.token;
  return {
    webSocketUrl: session.connectUrl,
    transport: "browser",
    close: async () => {
      try {
        await fetchImpl(`${BROWSERBASE_API_URL}/${encodeURIComponent(sessionId)}`, {
          method: "DELETE",
          headers: { "X-BB-API-Key": token },
        });
      } catch (err) {
        console.warn("[FKA] No se pudo cerrar la sesión remota del navegador", {
          sessionId,
          error: err instanceof Error ? err.message : "error desconocido",
        });
      }
    },
  };
}

function shouldRetryBrowserbasePayload(status: number): boolean {
  return status === 400 || status === 402 || status === 403 || status === 422;
}

function browserbaseSessionPayloads(projectId: string): Record<string, unknown>[] {
  const baseSettings = { recordSession: false, logSession: false, solveCaptchas: true };
  return [
    {
      projectId,
      timeout: 300,
      proxies: true,
      browserSettings: { ...baseSettings, advancedStealth: true },
    },
    {
      projectId,
      timeout: 300,
      proxies: true,
      browserSettings: baseSettings,
    },
    {
      projectId,
      timeout: 300,
      browserSettings: baseSettings,
    },
    {
      projectId,
      timeout: 300,
    },
    {
      timeout: 300,
    },
  ];
}
