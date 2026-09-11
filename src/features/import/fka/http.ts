export const FKA_BASE_URL = "https://www.footballkitarchive.com";

const REFERER = `${FKA_BASE_URL}/`;
const TIMEOUT_MS = 20000;

export const FKA_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type FkaProviderErrorCode =
  | "FKA_ACCESS_DENIED"
  | "FKA_NOT_FOUND"
  | "FKA_RATE_LIMITED"
  | "FKA_TEMPORARY_ERROR"
  | "FKA_TIMEOUT"
  | "FKA_INVALID_RESPONSE"
  | "FKA_NETWORK_ERROR";

export type FkaErrorDetails = {
  url?: string;
  status?: number;
  statusText?: string;
  redirected?: boolean;
  finalUrl?: string;
  responseHeaders?: Record<string, string>;
  bodyPreview?: string;
};

export class FkaProviderError extends Error {
  readonly code: FkaProviderErrorCode;
  readonly details: FkaErrorDetails;

  constructor(code: FkaProviderErrorCode, message: string, details: FkaErrorDetails = {}) {
    super(message);
    this.name = "FkaProviderError";
    this.code = code;
    this.details = details;
  }
}

export class FkaBlockedError extends FkaProviderError {
  constructor(message = "Football Kit Archive rechazó la solicitud automatizada.", details: FkaErrorDetails = {}) {
    super("FKA_ACCESS_DENIED", message, details);
    this.name = "FkaBlockedError";
  }
}

export function fkaErrorUserMessage(err: unknown): string {
  if (!(err instanceof FkaProviderError)) {
    return err instanceof Error ? err.message : "Error inesperado al consultar Football Kit Archive.";
  }

  switch (err.code) {
    case "FKA_ACCESS_DENIED":
      return "Football Kit Archive rechazó la consulta. Abre Chrome/Brave con CDP local y verifica que FKA cargue correctamente en ese navegador.";
    case "FKA_NOT_FOUND":
      return "Football Kit Archive no encontró el recurso solicitado.";
    case "FKA_RATE_LIMITED":
      return "Football Kit Archive limitó temporalmente las solicitudes. Intenta de nuevo en unos minutos.";
    case "FKA_TEMPORARY_ERROR":
      return "Football Kit Archive respondió con un error temporal. Intenta de nuevo más tarde.";
    case "FKA_TIMEOUT":
      return "Football Kit Archive no respondió a tiempo. Intenta de nuevo más tarde.";
    case "FKA_INVALID_RESPONSE":
      return "Football Kit Archive respondió con un formato inesperado.";
    case "FKA_NETWORK_ERROR":
      return "No se pudo conectar con Football Kit Archive.";
  }
}

export function isCloudflareChallenge(html: string): boolean {
  return (
    /Un momento|Just a moment|Verificación de seguridad|Checking your browser/i.test(html.slice(0, 500)) ||
    /cf-challenge|challenge-platform/i.test(html.slice(0, 2000))
  );
}

export function normalizeFkaBodyPreview(text: string): string {
  return text.slice(0, 500).replace(/\s+/g, " ").trim();
}

function safeHeaderSnapshot(headers: Headers): Record<string, string> {
  const allowed = ["content-type", "server", "cf-ray", "cf-cache-status", "location", "retry-after"];
  return Object.fromEntries(
    allowed
      .map((name) => [name, headers.get(name)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );
}

function codeFromStatus(status: number): FkaProviderErrorCode {
  if (status === 403) return "FKA_ACCESS_DENIED";
  if (status === 404) return "FKA_NOT_FOUND";
  if (status === 429) return "FKA_RATE_LIMITED";
  if (status >= 500) return "FKA_TEMPORARY_ERROR";
  return "FKA_NETWORK_ERROR";
}

function messageFromStatus(status: number, cloudflareChallenge: boolean): string {
  if (status === 403 && cloudflareChallenge) {
    return "Football Kit Archive respondió 403 con una página de verificación Cloudflare.";
  }
  if (status === 403) return "Football Kit Archive rechazó la solicitud.";
  if (status === 404) return "Recurso no encontrado en Football Kit Archive.";
  if (status === 429) return "Football Kit Archive limitó temporalmente las solicitudes.";
  if (status >= 500) return "Football Kit Archive respondió con un error temporal.";
  return `Football Kit Archive respondió HTTP ${status}.`;
}

function logFkaHttpError(error: FkaProviderError): void {
  console.warn("[FKA] Provider request failed", {
    code: error.code,
    url: error.details.url,
    status: error.details.status,
    statusText: error.details.statusText,
    redirected: error.details.redirected,
    finalUrl: error.details.finalUrl,
    responseHeaders: error.details.responseHeaders,
    bodyPreview: error.details.bodyPreview,
  });
}

export async function fetchFkaText(
  url: string,
  options: {
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        Referer: REFERER,
        "User-Agent": FKA_USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const text = await res.text();
    if (!res.ok) {
      const details = {
        url,
        status: res.status,
        statusText: res.statusText,
        redirected: res.redirected,
        finalUrl: res.url,
        responseHeaders: safeHeaderSnapshot(res.headers),
        bodyPreview: normalizeFkaBodyPreview(text),
      };
      const err = new FkaProviderError(
        codeFromStatus(res.status),
        messageFromStatus(res.status, isCloudflareChallenge(text)),
        details,
      );
      logFkaHttpError(err);
      throw err;
    }
    return text;
  } catch (err) {
    if (err instanceof FkaProviderError) throw err;
    if (controller.signal.aborted) {
      throw new FkaProviderError("FKA_TIMEOUT", "Football Kit Archive no respondió a tiempo.", { url });
    }
    throw new FkaProviderError(
      "FKA_NETWORK_ERROR",
      `No se pudo conectar con Football Kit Archive: ${err instanceof Error ? err.message : "error de red"}`,
      { url },
    );
  } finally {
    clearTimeout(timer);
  }
}
