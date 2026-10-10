export type CampaignDraft = {
  subject: string;
  body: string;
};

export function campaignProblems(draft: CampaignDraft): string | null {
  const subject = draft.subject.trim();
  const body = draft.body.trim();
  if (subject.length < 3) return "Escribe un asunto de al menos 3 caracteres.";
  if (subject.length > 120) return "El asunto es demasiado largo.";
  if (body.length < 10) return "Escribe el mensaje de la oferta.";
  if (body.length > 4000) return "El mensaje es demasiado largo.";
  return null;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function renderCampaignEmail(input: { body: string; unsubscribeHref: string }): { text: string; html: string } {
  const text = `${input.body.trim()}\n\nSi no quieres más correos de ofertas, entra aquí:\n${input.unsubscribeHref}`;
  const paragraphs = input.body
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
  const html = `${paragraphs}<p><a href="${escapeHtml(input.unsubscribeHref)}">Dejar de recibir ofertas</a></p>`;
  return { text, html };
}

export function subscribedEmails<T extends { email: string; unsubscribedAt: Date | null }>(rows: T[]): string[] {
  return rows.filter((row) => row.unsubscribedAt == null).map((row) => row.email);
}
