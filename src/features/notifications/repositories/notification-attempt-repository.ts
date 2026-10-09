import { prisma } from "@/lib/prisma";
import {
  NOTIFICATION_CHANNEL,
  ORDER_CREATED_PAID_EVENT,
  type NotificationResult,
} from "../types/notification-types";

const keyFor = (orderId: string, channel: string, eventKey: string) => `${orderId}:${channel}:${eventKey}`;

export async function sendNotificationAttempt(input: {
  orderId: string;
  channel: string;
  eventKey: string;
  transport: { sendMessage(message: string): Promise<NotificationResult> };
  message: string;
}) {
  return deliverNotification(input.orderId, input.channel, input.eventKey, input.transport, input.message);
}

export async function sendOrderNotification(orderId: string, transport: { sendMessage(message: string): Promise<NotificationResult> }, message: string) {
  return deliverNotification(orderId, NOTIFICATION_CHANNEL, ORDER_CREATED_PAID_EVENT, transport, message);
}

async function deliverNotification(
  orderId: string,
  channel: string,
  eventKey: string,
  transport: { sendMessage(message: string): Promise<NotificationResult> },
  message: string,
) {
  const idempotencyKey = keyFor(orderId, channel, eventKey);
  const existing = await prisma.notificationAttempt.findUnique({ where: { idempotencyKey } });
  if (existing?.status === "SENT") return { status: "ALREADY_SENT" as const };

  let attempt = existing;
  if (existing) {
    // PENDING is reclaimable: a serverless freeze can leave the row stuck after PAID.
    const claimed = await prisma.notificationAttempt.updateMany({
      where: { id: existing.id, status: { in: ["FAILED", "NOT_CONFIGURED", "PENDING"] } },
      data: { status: "PENDING", attemptCount: { increment: 1 }, lastAttemptAt: new Date(), errorSummary: null },
    });
    if (claimed.count === 0) return { status: "ALREADY_SENT" as const };
    attempt = await prisma.notificationAttempt.findUniqueOrThrow({ where: { id: existing.id } });
  } else {
    try {
      attempt = await prisma.notificationAttempt.create({
        data: { orderId, channel, eventKey, idempotencyKey, status: "PENDING", attemptCount: 1, lastAttemptAt: new Date() },
      });
    } catch (error) {
      const concurrent = await prisma.notificationAttempt.findUnique({ where: { idempotencyKey } });
      if (concurrent) return { status: "ALREADY_SENT" as const };
      throw error;
    }
  }

  const result = await transport.sendMessage(message);
  await prisma.notificationAttempt.update({
    where: { id: attempt.id },
    data: result.status === "SENT"
      ? { status: "SENT", providerRef: result.providerMessageRef ?? null, sentAt: new Date(), errorSummary: null }
      : { status: result.status, errorSummary: result.status === "FAILED" ? `${result.errorCode}: ${result.errorMessage}`.slice(0, 240) : null },
  });
  return result;
}

export function notificationIdempotencyKey(orderId: string) {
  return keyFor(orderId, NOTIFICATION_CHANNEL, ORDER_CREATED_PAID_EVENT);
}