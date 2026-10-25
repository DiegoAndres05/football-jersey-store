export type LegalDocument = { documentKey: string; url: string; documentVersion: string };
export type LegalConfig = Record<"terms" | "privacy" | "dataProcessing" | "returns", LegalDocument>;

const publicFallback: LegalConfig = {
  terms: { documentKey: "terms", documentVersion: "publica", url: "/terminos" },
  privacy: { documentKey: "privacy", documentVersion: "publica", url: "/privacidad" },
  dataProcessing: { documentKey: "dataProcessing", documentVersion: "publica", url: "/tratamiento-datos" },
  returns: { documentKey: "returns", documentVersion: "publica", url: "/cambios-devoluciones" },
};

function isPublicHttpsUrl(url: string): boolean {
  if (!url || /\s/.test(url) || /LEGAL_/i.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.username === "" && parsed.password === "" && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

function isPublishableVersion(version: string): boolean {
  if (!version || version.length > 40 || /\s/.test(version)) return false;
  if (version.toLowerCase() === "draft") return false;
  if (/LEGAL_/i.test(version)) return false;
  return true;
}

function isPublishableKey(key: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,40}$/i.test(key);
}

function document(env: Record<string, string | undefined>, prefix: string): LegalDocument | null {
  const url = env[`${prefix}_URL`] ?? "";
  const documentVersion = env[`${prefix}_VERSION`]?.trim() ?? "";
  const documentKey = env[`${prefix}_KEY`]?.trim() ?? "";
  const cleanUrl = url.trim();
  if (cleanUrl !== url.trim() || !isPublicHttpsUrl(cleanUrl)) return null;
  if (!isPublishableVersion(documentVersion) || !isPublishableKey(documentKey)) return null;
  return { url: cleanUrl, documentVersion, documentKey };
}

export function getLegalConfig(env: Record<string, string | undefined> = process.env): LegalConfig {
  const values = {
    terms: document(env, "LEGAL_TERMS") ?? publicFallback.terms,
    privacy: document(env, "LEGAL_PRIVACY") ?? publicFallback.privacy,
    dataProcessing: document(env, "LEGAL_DATA_PROCESSING") ?? publicFallback.dataProcessing,
    returns: document(env, "LEGAL_RETURNS") ?? publicFallback.returns,
  };

  const usedFallback = Object.values(values).some((doc) =>
    doc.url === publicFallback.terms.url ||
    doc.url === publicFallback.privacy.url ||
    doc.url === publicFallback.dataProcessing.url ||
    doc.url === publicFallback.returns.url,
  );

  if (usedFallback) {
    console.warn("Falta configuración legal; usando páginas públicas de la tienda para continuar con la compra.");
  }

  return values as LegalConfig;
}
