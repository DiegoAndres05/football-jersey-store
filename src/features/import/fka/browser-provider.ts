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
  fetchImpl?: typeof fetch;
};

const BROWSERBASE_API_URL = "https://api.browserbase.com/v1/sessions";

export function readFkaBrowserEnv(): FkaBrowserEnv {
  return {
    endpoint: emptyToNull(process.env.FKA_CDP_ENDPOINT),
    token: emptyToNull(process.env.FKA_CDP_TOKEN) ?? emptyToNull(process.env.FKA_BROWSERBASE_API_KEY),
    browserbaseProjectId: emptyToNull(process.env.FKA_BROWSERBASE_PROJECT_ID),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function describeFkaBrowserMode(env: FkaBrowserEnv = readFkaBrowserEnv()): "local-devtools" | "websocket" | "browserbase" {
  const endpoint = env.endpoint ?? "";
  if (/^wss?:\/\//i.test(endpoint)) return "websocket";
  if (/^https?:\/\//i.test(endpoint) && !/browserbase\.com/i.test(endpoint)) return "local-devtools";
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
    );
  }
  if (!env.browserbaseProjectId) {
    throw new FkaProviderError(
      "FKA_NETWORK_ERROR",
      "Falta FKA_BROWSERBASE_PROJECT_ID para el navegador remoto.",
    );
  }
  const fetchImpl = env.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await fetchImpl(BROWSERBASE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: env.browserbaseProjectId,
        timeout: 300,
        browserSettings: {
          recordSession: false,
          logSession: false,
        },
      }),
    });
  } catch (err) {
    throw new FkaProviderError(
      "FKA_NETWORK_ERROR",
      `No se pudo conectar con el proveedor del navegador FKA: ${err instanceof Error ? err.message : "error de red"}`,
      { url: BROWSERBASE_API_URL },
    );
  }
  if (!res.ok) {
    throw new FkaProviderError("FKA_NETWORK_ERROR", "No se pudo crear la sesión del navegador FKA.", {
      url: BROWSERBASE_API_URL,
      status: res.status,
      statusText: res.statusText,
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
          headers: { Authorization: `Bearer ${token}` },
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
