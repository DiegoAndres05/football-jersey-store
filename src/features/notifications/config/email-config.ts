function normalizeEmailValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
}

export function getEmailConfig() {
  const apiKey = normalizeEmailValue(process.env.RESEND_API_KEY);
  const from = normalizeEmailValue(process.env.EMAIL_FROM);
  return apiKey && from ? { apiKey, from } : null;
}
