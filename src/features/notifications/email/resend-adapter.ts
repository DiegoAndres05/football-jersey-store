import { getEmailConfig } from "../config/email-config";
import type { NotificationTransport } from "../ports/notification-transport";

export function createResendTransport(
  input: { to: string; subject: string; html: string },
  fetcher: typeof fetch = fetch,
): NotificationTransport {
  return {
    async sendMessage(text) {
      const config = getEmailConfig();
      if (!config) return { status: "NOT_CONFIGURED" };
      try {
        const response = await fetcher("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: config.from,
            to: [input.to],
            subject: input.subject,
            html: input.html,
            text,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data = (await response.json()) as { id?: string };
        if (!response.ok || !data.id) {
          return {
            status: "FAILED",
            errorCode: "EMAIL_REJECTED",
            errorMessage: "El proveedor rechazó el correo.",
          };
        }
        return { status: "SENT", providerMessageRef: data.id };
      } catch {
        return { status: "FAILED", errorCode: "EMAIL_UNAVAILABLE", errorMessage: "No se pudo contactar el proveedor de correo." };
      }
    },
  };
}
