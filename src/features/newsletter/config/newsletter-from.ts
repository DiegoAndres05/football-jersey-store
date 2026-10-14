const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function normalizeNewsletterValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
}

/** Remitente que Resend acepta: `correo@dominio` o `Nombre <correo@dominio>`. */
export function isNewsletterFrom(value: string): boolean {
  if (value.length > 320 || /[\r\n]/.test(value)) return false;
  if (EMAIL.test(value)) return true;
  const named = value.match(/^(.+) <([^<>\s]+)>$/);
  if (!named) return false;
  const name = named[1].trim();
  return name.length > 0 && name.length <= 80 && !name.includes("<") && EMAIL.test(named[2]);
}

export type NewsletterConfig =
  | { ok: true; apiKey: string; from: string }
  | { ok: false; error: string };

/**
 * Configuración solo de marketing. No lee EMAIL_FROM.
 * El dominio del remitente tiene que estar verificado en Resend; esta función no lo comprueba.
 */
export function getNewsletterConfig(
  env: { apiKey?: string; from?: string } = {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.NEWSLETTER_FROM,
  },
): NewsletterConfig {
  const from = normalizeNewsletterValue(env.from);
  if (!from) {
    return { ok: false, error: "Falta el remitente del newsletter. Configura NEWSLETTER_FROM." };
  }
  if (!isNewsletterFrom(from)) {
    return { ok: false, error: "El remitente del newsletter no es válido." };
  }
  const apiKey = normalizeNewsletterValue(env.apiKey);
  if (!apiKey) {
    return { ok: false, error: "El correo no está configurado en este servidor." };
  }
  return { ok: true, apiKey, from };
}
