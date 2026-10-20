const RECIPIENT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isCampaignRecipient(email: string): boolean {
  return email.length <= 320 && RECIPIENT.test(email);
}

export function resendAcceptedIds(body: unknown): string[] | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  return data.map((item) => {
    if (!item || typeof item !== "object") return "";
    const id = (item as { id?: unknown }).id;
    return typeof id === "string" ? id : "";
  });
}

export function resendSingleId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const id = (body as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export function resendErrorText(body: unknown): string {
  if (!body || typeof body !== "object") return "El proveedor rechazó el envío.";
  const message = (body as { message?: unknown }).message;
  if (typeof message !== "string") return "El proveedor rechazó el envío.";
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean) return "El proveedor rechazó el envío.";
  return clean.slice(0, 180);
}
