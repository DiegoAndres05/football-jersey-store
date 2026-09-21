export type LegalDocument = { documentKey: string; url: string; documentVersion: string };
export type LegalConfig = Record<"terms" | "privacy" | "dataProcessing" | "returns", LegalDocument>;

function document(env: NodeJS.ProcessEnv, prefix: string): LegalDocument | null {
  const url = env[`${prefix}_URL`]?.trim();
  const documentVersion = env[`${prefix}_VERSION`]?.trim();
  const documentKey = env[`${prefix}_KEY`]?.trim();
  if (!url || !documentVersion || !documentKey || !url.startsWith("https://")) return null;
  return { url, documentVersion, documentKey };
}

export function getLegalConfig(env: NodeJS.ProcessEnv = process.env): LegalConfig | null {
  const values = {
    terms: document(env, "LEGAL_TERMS"),
    privacy: document(env, "LEGAL_PRIVACY"),
    dataProcessing: document(env, "LEGAL_DATA_PROCESSING"),
    returns: document(env, "LEGAL_RETURNS"),
  };
  return Object.values(values).every(Boolean) ? values as LegalConfig : null;
}
