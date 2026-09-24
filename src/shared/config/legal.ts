export type LegalDocument = { documentKey: string; url: string; documentVersion: string };
export type LegalConfig = Record<"terms" | "privacy" | "dataProcessing" | "returns", LegalDocument>;

const publicFallback: LegalConfig = {
  terms: { documentKey: "terms", documentVersion: "publica", url: "/terminos" },
  privacy: { documentKey: "privacy", documentVersion: "publica", url: "/privacidad" },
  dataProcessing: { documentKey: "dataProcessing", documentVersion: "publica", url: "/tratamiento-datos" },
  returns: { documentKey: "returns", documentVersion: "publica", url: "/cambios-devoluciones" },
};

function document(env: NodeJS.ProcessEnv, prefix: string): LegalDocument | null {
  const url = env[`${prefix}_URL`]?.trim();
  const documentVersion = env[`${prefix}_VERSION`]?.trim();
  const documentKey = env[`${prefix}_KEY`]?.trim();
  if (!url || !documentVersion || !documentKey || !url.startsWith("https://")) return null;
  return { url, documentVersion, documentKey };
}

export function getLegalConfig(env: NodeJS.ProcessEnv = process.env): LegalConfig {
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
