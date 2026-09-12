/**
 * Resuelve la URL pública absoluta del sitio.
 *
 * - Production: NEXT_PUBLIC_SITE_URL HTTPS obligatoria. Throw si falta, es HTTP,
 *   localhost, tiene path, o es inválida.
 * - Development: fallback a http://localhost:3000 si no está definida.
 */

const LOCALHOST_FALLBACK = "http://localhost:3000";

export function resolvePublicOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!raw) {
    if (isProduction) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL es obligatoria en producción. Configura una URL HTTPS válida (ej: https://flashsport.co).",
      );
    }
    return LOCALHOST_FALLBACK;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL no es una URL válida: "${raw}".`);
  }

  // HTTPS required in production
  if (isProduction && url.protocol !== "https:") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL debe usar HTTPS en producción. Recibido: "${raw}".`,
    );
  }

  // No localhost in production
  if (isProduction && (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1")) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL no puede ser localhost/127.0.0.1 en producción. Recibido: "${raw}".`,
    );
  }

  // No path allowed (only origin)
  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL no debe incluir path. Recibido: "${raw}". Usa solo el origen (ej: https://flashsport.co).`,
    );
  }

  // Normalize: strip trailing slash
  return url.origin;
}
