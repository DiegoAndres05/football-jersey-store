import type { NotificationResult } from "../types/notification-types";

export type NotificationTransport = {
  sendMessage: (message: string) => Promise<NotificationResult>;
};