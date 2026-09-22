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
  nodeEnv?: string | null;
};

export const FKA_IMPORTER_DISABLED_MESSAGE =
  "El importador FKA solo está disponible en el entorno local (Brave CDP).";

export function isFkaImporterEnabled(env?: { FKA_IMPORTER_ENABLED?: string }): boolean {
  const source = env ?? (process.env as { FKA_IMPORTER_ENABLED?: string });
  return source.FKA_IMPORTER_ENABLED?.trim() === "true";
}

export function readFkaBrowserEnv(): FkaBrowserEnv {
  return {
    endpoint: emptyToNull(process.env.FKA_CDP_ENDPOINT),
    token: emptyToNull(process.env.FKA_CDP_TOKEN),
    nodeEnv: emptyToNull(process.env.NODE_ENV),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/^['"]|['"]$/g, "");
  return trimmed ? trimmed : null;
}

export function describeFkaBrowserMode(
  env: FkaBrowserEnv = readFkaBrowserEnv(),
): "local-devtools" | "websocket" | "none" {
  const endpoint = env.endpoint ?? "";
  if (/^wss?:\/\//i.test(endpoint)) return "websocket";
  const isHttpDevtools = /^https?:\/\//i.test(endpoint);
  const isLoopback = /\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/i.test(endpoint);
  if (isHttpDevtools && isLoopback && env.nodeEnv !== "production") return "local-devtools";
  return "none";
}

export async function openFkaBrowser(env: FkaBrowserEnv = readFkaBrowserEnv()): Promise<FkaBrowserHandle> {
  const mode = describeFkaBrowserMode(env);
  if (mode === "local-devtools") return openLocalDevtools(env.endpoint!);
  if (mode === "websocket") return openDirectWebsocket(env.endpoint!, env.token);
  throw new FkaProviderError(
    "FKA_NETWORK_ERROR",
    "No hay un navegador FKA configurado. Define FKA_CDP_ENDPOINT=http://127.0.0.1:9222 y arranca Brave con --remote-debugging-port=9222.",
    { reason: "cdp local" },
  );
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
