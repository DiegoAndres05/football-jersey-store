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
import { isCampaignRecipient, resendAcceptedIds, resendErrorText, resendSingleId } from "../domain/resend-batch";
import { readUnsubscribeToken, unsubscribeUrl } from "../domain/unsubscribe-token";

const BATCH_SIZE = 100;

export type CampaignSendResult =
  | { ok: true; sent: number; failed: number; skipped: number }
  | { ok: false; error: string };

export async function sendNewsletterCampaign(
  previous: CampaignSendResult | null,
  formData: FormData,
): Promise<CampaignSendResult> {
  try {
    return await sendPlainNewsletterCampaign(previous, formData);
  } catch (err) {
    console.error("[newsletter] plain campaign failed:", err);
    return { ok: false, error: "No pudimos enviar la campaña. Intenta de nuevo." };
  }
}

async function sendPlainNewsletterCampaign(
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
  if (result.sent === 0) {
    return { ok: false, error: result.error ?? "No se pudo enviar la campaña." };
  }
  return { ok: true, sent: result.sent, failed: result.failed, skipped };
}

export async function sendDesignedNewsletterCampaign(input: unknown): Promise<CampaignSendResult> {
  try {
    return await sendDesignedCampaign(input);
  } catch (err) {
    console.error("[newsletter] designed campaign failed:", err);
    return { ok: false, error: "No pudimos enviar la campaña. Intenta de nuevo." };
  }
}

async function sendDesignedCampaign(input: unknown): Promise<CampaignSendResult> {
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
  if (result.sent === 0) {
    return { ok: false, error: result.error ?? "No se pudo enviar la campaña." };
  }
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

type CampaignMail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
};

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function postResend(
  fetcher: typeof fetch,
  apiKey: string,
  path: "/emails" | "/emails/batch",
  body: unknown,
): Promise<{ ok: true; body: unknown } | { ok: false; status: number; error: string }> {
  try {
    const response = await fetcher(path === "/emails" ? "https://api.resend.com/emails" : "https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const payload = await readJson(response);
    if (!response.ok) {
      console.error("[newsletter] Resend rejected the campaign:", response.status);
      return { ok: false, status: response.status, error: resendErrorText(payload) };
    }
    return { ok: true, body: payload };
  } catch (err) {
    console.error("[newsletter] Resend request failed:", err);
    return { ok: false, status: 0, error: "No se pudo contactar el proveedor de correo." };
  }
}

async function deliverCampaignBatches(input: {
  recipients: string[];
  subject: string;
  origin: string;
  from: string;
  apiKey: string;
  render: (unsubscribeHref: string) => { html: string; text: string };
  fetcher?: typeof fetch;
}): Promise<{ sent: number; failed: number; error: string | null }> {
  const fetcher = input.fetcher ?? fetch;
  let sent = 0;
  let failed = 0;
  let error: string | null = null;
  for (let index = 0; index < input.recipients.length; index += BATCH_SIZE) {
    const chunk = input.recipients.slice(index, index + BATCH_SIZE);
    const payload: CampaignMail[] = [];
    for (const email of chunk) {
      if (!isCampaignRecipient(email)) {
        failed += 1;
        error = "Hay un suscriptor con un correo inválido.";
        continue;
      }
      const href = unsubscribeUrl(input.origin, email);
      if (!href) {
        failed += 1;
        error = "No pudimos preparar el enlace de baja.";
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
    const batch = await postResend(fetcher, input.apiKey, "/emails/batch", payload);
    if (batch.ok) {
      const ids = resendAcceptedIds(batch.body);
      if (ids) {
        const accepted = ids.filter(Boolean).length;
        sent += accepted;
        failed += payload.length - accepted;
        if (accepted < payload.length) error = "El proveedor no aceptó todos los correos.";
        continue;
      }
    }
    const batchError = batch.ok ? "El proveedor no confirmó el envío." : batch.error;
    if (!batch.ok && (batch.status === 401 || batch.status === 403)) {
      failed += payload.length;
      error = batchError;
      break;
    }
    let handled = 0;
    let repeated = 0;
    for (const mail of payload) {
      handled += 1;
      const single = await postResend(fetcher, input.apiKey, "/emails", mail);
      const id = single.ok ? resendSingleId(single.body) : null;
      if (id) {
        sent += 1;
        repeated = 0;
        continue;
      }
      failed += 1;
      error = single.ok ? "El proveedor no confirmó el envío." : single.error;
      if (!single.ok && (single.status === 401 || single.status === 403 || /domain|verif/i.test(single.error))) {
        repeated += 1;
      }
      if (repeated >= 2) {
        failed += payload.length - handled;
        break;
      }
    }
    if (sent === 0 && error === null) error = batchError;
  }
  return { sent, failed, error };
}
