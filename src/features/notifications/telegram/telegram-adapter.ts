import { getTelegramConfig } from "../config/telegram-config";
import type { NotificationResult } from "../types/notification-types";
import type { NotificationTransport } from "../ports/notification-transport";

export function createTelegramTransport(fetcher: typeof fetch = fetch): NotificationTransport {
  return {
    async sendMessage(message) {
      const config = getTelegramConfig();
      if (!config) return { status: "NOT_CONFIGURED" };
      try {
        const response = await fetcher(`https://api.telegram.org/bot${config.token}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: config.chatId, text: message }),
          signal: AbortSignal.timeout(8000),
        });
        const data = (await response.json()) as { ok?: boolean; result?: { message_id?: number } };
        if (!response.ok || !data.ok) return { status: "FAILED", errorCode: "TELEGRAM_REJECTED", errorMessage: "Telegram rechazó el mensaje." };
        return { status: "SENT", providerMessageRef: data.result?.message_id?.toString() };
      } catch {
        return { status: "FAILED", errorCode: "TELEGRAM_UNAVAILABLE", errorMessage: "No se pudo contactar Telegram." };
      }
    },
  };
}