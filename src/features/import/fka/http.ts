export const FKA_BASE_URL = "https://www.footballkitarchive.com";

const REFERER = `${FKA_BASE_URL}/`;
const TIMEOUT_MS = 20000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 250;

export const FKA_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type FkaRequestKind = "document" | "xhr";

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
  /** Short, safe phrase safe to show in the admin UI. Never a URL, header, or secret. */
  reason?: string;
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

const USER_MESSAGES: Record<FkaProviderErrorCode, string> = {
  FKA_ACCESS_DENIED: "Football Kit Archive rechazó la consulta.",
  FKA_NOT_FOUND: "Football Kit Archive no encontró el recurso solicitado.",
  FKA_RATE_LIMITED: "Football Kit Archive limitó temporalmente las solicitudes. Intenta de nuevo en unos minutos.",
  FKA_TEMPORARY_ERROR: "Football Kit Archive respondió con un error temporal. Intenta de nuevo más tarde.",
  FKA_TIMEOUT: "Football Kit Archive no respondió a tiempo. Intenta de nuevo más tarde.",
  FKA_INVALID_RESPONSE: "Football Kit Archive respondió con un formato inesperado.",
  FKA_NETWORK_ERROR: "No se pudo conectar con Football Kit Archive.",
};

export function fkaErrorUserMessage(err: unknown): string {
  if (!(err instanceof FkaProviderError)) {
    return err instanceof Error ? err.message : "Error inesperado al consultar Football Kit Archive.";
  }
  return withSafeDiagnostic(USER_MESSAGES[err.code], err);
}

function withSafeDiagnostic(base: string, err: FkaProviderError): string {
  const heading = err.details.reason === "navegador remoto" ? err.message : base;
  const parts: string[] = [];
  if (typeof err.details.status === "number") parts.push(`HTTP ${err.details.status}`);
  if (err.code === "FKA_ACCESS_DENIED" && err.details.bodyPreview && isCloudflareChallenge(err.details.bodyPreview)) {
    parts.push("verificación Cloudflare");
  }
  if (err.code === "FKA_NETWORK_ERROR" && err.details.reason !== "navegador remoto") {
    parts.push(err.details.reason ?? "error de red");
  }
  if (err.code === "FKA_TIMEOUT") parts.push("tiempo de espera agotado");
  if (parts.length === 0) return heading;
  return `${heading.replace(/\.$/, "")} (${parts.join(", ")}).`;
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

export function fkaRequestHeaders(kind: FkaRequestKind = "xhr"): Record<string, string> {
  const common = {
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    Referer: REFERER,
    "User-Agent": FKA_USER_AGENT,
  };
  if (kind === "document") {
    return {
      ...common,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Upgrade-Insecure-Requests": "1",
    };
  }
  return {
    ...common,
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  };
}

const NETWORK_REASONS: Record<string, string> = {
  ECONNREFUSED: "conexión rechazada",
  ENOTFOUND: "host no resuelto",
  EAI_AGAIN: "host no resuelto",
  ECONNRESET: "conexión cerrada",
  ETIMEDOUT: "tiempo de conexión agotado",
  UND_ERR_CONNECT_TIMEOUT: "tiempo de conexión agotado",
  UND_ERR_SOCKET: "conexión cerrada",
};

export function safeNetworkReason(err: unknown): string {
  const code = readSystemCode(err);
  if (code && NETWORK_REASONS[code]) return NETWORK_REASONS[code];
  return "error de red";
}

function readSystemCode(err: unknown): string | undefined {
  const seen = new Set<unknown>();
  let current: unknown = err;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && code.length > 0 && code.length < 64 && /^[A-Z0-9_]+$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
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
    reason: error.details.reason,
  });
}

function isRetryableFkaError(err: FkaProviderError): boolean {
  return (
    err.code === "FKA_ACCESS_DENIED" ||
    err.code === "FKA_RATE_LIMITED" ||
    err.code === "FKA_TEMPORARY_ERROR" ||
    err.code === "FKA_NETWORK_ERROR"
  );
}

async function fetchFkaTextOnce(
  url: string,
  options: {
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    kind?: FkaRequestKind;
  },
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: fkaRequestHeaders(options.kind ?? "xhr"),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new FkaProviderError(codeFromStatus(res.status), messageFromStatus(res.status, isCloudflareChallenge(text)), {
        url,
        status: res.status,
        statusText: res.statusText,
        redirected: res.redirected,
        finalUrl: res.url,
        responseHeaders: safeHeaderSnapshot(res.headers),
        bodyPreview: normalizeFkaBodyPreview(text),
      });
    }
    return text;
  } catch (err) {
    if (err instanceof FkaProviderError) throw err;
    if (controller.signal.aborted) {
      throw new FkaProviderError("FKA_TIMEOUT", "Football Kit Archive no respondió a tiempo.", { url });
    }
    const reason = safeNetworkReason(err);
    throw new FkaProviderError("FKA_NETWORK_ERROR", "No se pudo conectar con Football Kit Archive.", { url, reason });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFkaText(
  url: string,
  options: {
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    kind?: FkaRequestKind;
    maxRetries?: number;
    retryDelayMs?: number;
  } = {},
): Promise<string> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  let kind = options.kind ?? "xhr";
  let lastError: FkaProviderError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFkaTextOnce(url, { ...options, kind });
    } catch (err) {
      if (!(err instanceof FkaProviderError)) throw err;
      lastError = err;
      if (!isRetryableFkaError(err) || attempt === maxRetries) {
        logFkaHttpError(err);
        throw err;
      }
      if (err.code === "FKA_ACCESS_DENIED") kind = kind === "xhr" ? "document" : "xhr";
      if (retryDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw lastError ?? new FkaProviderError("FKA_NETWORK_ERROR", "No se pudo conectar con Football Kit Archive.", { url, reason: "error de red" });
}
