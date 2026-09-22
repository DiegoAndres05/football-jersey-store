/**
 * Descarga y validación de imágenes de Football Kit Archive.
 * Único propósito: convertir la imageUrl de FKA en un buffer seguro
 * para subirlo a Supabase Storage.
 *
 * - Solo se permite el host de FKA/CDN (HTTPS).
 * - Se valida MIME image/* y un tamaño máximo razonable.
 * - Errores HTTP y timeout controlados.
 * - Nunca se confía en una URL arbitraria del cliente.
 */

import { FKA_USER_AGENT } from "./http.ts";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const ALLOWED_HOSTS = new Set(["www.footballkitarchive.com", "cdn.footballkitarchive.com"]);
const FKA_ORIGIN = "https://www.footballkitarchive.com";
const MAX_REDIRECTS = 5;

export const MAX_FKA_IMAGE_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class FkaImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FkaImageError";
  }
}

export function assertAllowedFkaImageUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new FkaImageError("URL de imagen inválida.");
  }
  if (parsed.protocol !== "https:") {
    throw new FkaImageError("La imagen debe servirse por HTTPS.");
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new FkaImageError("El origen de la imagen no está permitido.");
  }
  if (isPrivateOrReservedIp(parsed.hostname)) {
    throw new FkaImageError("El destino de la imagen no está permitido.");
  }
}

async function assertSafeFkaImageUrl(url: string): Promise<void> {
  assertAllowedFkaImageUrl(url);

  const hostname = new URL(url).hostname;
  if (isIP(hostname)) return;

  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new FkaImageError("No se pudo resolver el destino de la imagen.");
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateOrReservedIp(address))) {
    throw new FkaImageError("El destino de la imagen no está permitido.");
  }
}

function isPrivateOrReservedIp(value: string): boolean {
  const normalized = value.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(normalized) === 4) {
    const octets = normalized.split(".").map(Number);
    const [first, second] = octets;
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 0) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    );
  }
  if (isIP(normalized) === 6) {
    const first = Number.parseInt(normalized.slice(0, 2), 16);
    return (
      normalized === "::1" ||
      normalized === "::" ||
      (first & 0xfe) === 0xfc ||
      (first & 0xff) === 0xfe ||
      normalized.startsWith("ff")
    );
  }
  return false;
}

export function fkaImageExtension(mime: string): string | null {
  return EXT_BY_MIME[mime] ?? null;
}

export async function downloadFkaImage(url: string, timeoutMs = 15000): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let currentUrl = url;
  let res: Response;
  try {
    for (let redirectCount = 0; ; redirectCount++) {
      await assertSafeFkaImageUrl(currentUrl);
      res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          Referer: `${FKA_ORIGIN}/`,
          "User-Agent": FKA_USER_AGENT,
        },
      });

      if (res.url) await assertSafeFkaImageUrl(res.url);
      if (res.status < 300 || res.status >= 400) break;

      if (redirectCount >= MAX_REDIRECTS) {
        throw new FkaImageError("La imagen excedió el límite de redirecciones permitido.");
      }
      const location = res.headers.get("location");
      if (!location) {
        throw new FkaImageError("La imagen respondió con una redirección sin destino.");
      }
      currentUrl = new URL(location, currentUrl).toString();
    }
  } catch (err) {
    if (err instanceof FkaImageError) throw err;
    if (controller.signal.aborted) throw new FkaImageError("Tiempo de espera agotado al descargar la imagen.");
    throw new FkaImageError(`No se pudo descargar la imagen: ${err instanceof Error ? err.message : "error de red"}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new FkaImageError(`La imagen respondió con estado HTTP ${res.status}.`);
  }

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const extension = fkaImageExtension(contentType);
  if (!extension) {
    throw new FkaImageError("La imagen no es un formato válido (JPG, PNG o WebP).");
  }

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new FkaImageError("La imagen descargada está vacía.");
  }
  if (arrayBuffer.byteLength > MAX_FKA_IMAGE_BYTES) {
    throw new FkaImageError("La imagen supera el tamaño máximo permitido (5 MB).");
  }

  return { buffer: Buffer.from(arrayBuffer), contentType, extension };
}
