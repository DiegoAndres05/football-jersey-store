"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/features/auth/server/session";
import { prisma } from "@/lib/prisma";
import { getNewsletterConfig } from "../config/newsletter-from";
import { resolvePublicOrigin } from "@/shared/config/public-origin";
import { campaignProblems, renderCampaignEmail, subscribedEmails } from "../domain/campaign-message";
import {
  documentProblems,
  parseCampaignDocument,
  renderCampaignPreview,
  renderCampaignText,
} from "../domain/campaign-document";
import { readUnsubscribeToken, unsubscribeUrl } from "../domain/unsubscribe-token";

const BATCH_SIZE = 100;

export type CampaignSendResult =
  | { ok: true; sent: number; failed: number; skipped: number }
  | { ok: false; error: string };

export async function sendNewsletterCampaign(
  _previous: CampaignSendResult | null,
  formData: FormData,
): Promise<CampaignSendResult> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const draft = {
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
  };
  const problem = campaignProblems(draft);
  if (problem) return { ok: false, error: problem };

  const newsletter = getNewsletterConfig();
  if (!newsletter.ok) return { ok: false, error: newsletter.error };

  const rows = await prisma.newsletterSubscriber.findMany({
    select: { email: true, unsubscribedAt: true },
  });
  const recipients = subscribedEmails(rows);
  const skipped = rows.length - recipients.length;
  if (recipients.length === 0) {
    return { ok: false, error: "No hay suscriptores activos." };
  }

  let origin: string;
  try {
    origin = resolvePublicOrigin();
  } catch {
    return { ok: false, error: "Falta la URL pública del sitio para el enlace de baja." };
  }

  const body = draft.body.trim();
  const result = await deliverCampaignBatches({
    recipients,
    subject: draft.subject.trim(),
    origin,
    from: newsletter.from,
    apiKey: newsletter.apiKey,
    render: (href) => renderCampaignEmail({ body, unsubscribeHref: href }),
  });
  revalidatePath("/admin/newsletter");
  return { ok: true, sent: result.sent, failed: result.failed, skipped };
}

export async function sendDesignedNewsletterCampaign(input: unknown): Promise<CampaignSendResult> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const document = parseCampaignDocument(input);
  if (!document) return { ok: false, error: "La campaña no es válida." };

  let origin: string;
  try {
    origin = resolvePublicOrigin();
  } catch {
    return { ok: false, error: "Falta la URL pública del sitio para el enlace de baja." };
  }
  const problems = documentProblems(document, origin);
  if (problems.length > 0) return { ok: false, error: problems[0] };

  const newsletter = getNewsletterConfig();
  if (!newsletter.ok) return { ok: false, error: newsletter.error };

  const rows = await prisma.newsletterSubscriber.findMany({
    select: { email: true, unsubscribedAt: true },
  });
  const recipients = subscribedEmails(rows);
  const skipped = rows.length - recipients.length;
  if (recipients.length === 0) return { ok: false, error: "No hay suscriptores activos." };

  const result = await deliverCampaignBatches({
    recipients,
    subject: document.subject.trim(),
    origin,
    from: newsletter.from,
    apiKey: newsletter.apiKey,
    render: (href) => ({
      html: renderCampaignPreview(document, origin, href),
      text: renderCampaignText(document, origin, href),
    }),
  });
  revalidatePath("/admin/newsletter");
  return { ok: true, sent: result.sent, failed: result.failed, skipped };
}

export async function confirmNewsletterUnsubscribe(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = readUnsubscribeToken(token);
  if (!email) return { ok: false, error: "El enlace no es válido." };
  const updated = await prisma.newsletterSubscriber.updateMany({
    where: { email },
    data: { unsubscribedAt: new Date() },
  });
  if (updated.count === 0) return { ok: false, error: "Ese correo no está en la lista." };
  return { ok: true };
}

async function deliverCampaignBatches(input: {
  recipients: string[];
  subject: string;
  origin: string;
  from: string;
  apiKey: string;
  render: (unsubscribeHref: string) => { html: string; text: string };
  fetcher?: typeof fetch;
}): Promise<{ sent: number; failed: number }> {
  const fetcher = input.fetcher ?? fetch;
  let sent = 0;
  let failed = 0;
  for (let index = 0; index < input.recipients.length; index += BATCH_SIZE) {
    const chunk = input.recipients.slice(index, index + BATCH_SIZE);
    const payload = [];
    for (const email of chunk) {
      const href = unsubscribeUrl(input.origin, email);
      if (!href) {
        failed += 1;
        continue;
      }
      const rendered = input.render(href);
      payload.push({
        from: input.from,
        to: [email],
        subject: input.subject,
        html: rendered.html,
        text: rendered.text,
      });
    }
    if (payload.length === 0) continue;
    try {
      const response = await fetcher("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          authorization: `Bearer ${input.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      const data = (await response.json()) as { data?: { id?: string }[] };
      if (!response.ok || !Array.isArray(data.data)) {
        failed += payload.length;
        continue;
      }
      const accepted = data.data.filter((item) => item.id).length;
      sent += accepted;
      failed += payload.length - accepted;
    } catch {
      failed += payload.length;
    }
  }
  return { sent, failed };
}
