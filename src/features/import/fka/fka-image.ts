import "server-only";

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

const ALLOWED_HOSTS = new Set(["www.footballkitarchive.com", "cdn.footballkitarchive.com"]);

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
}

export function fkaImageExtension(mime: string): string | null {
  return EXT_BY_MIME[mime] ?? null;
}

export async function downloadFkaImage(url: string, timeoutMs = 15000): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  assertAllowedFkaImageUrl(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal, redirect: "follow" });
  } catch (err) {
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
