import { z } from "zod";
import type { DeliveryMode } from "@/features/notifications/types/notification-types";

export const adminDeliveryModeSchema = z.enum(["INMEDIATA", "BAJO_PEDIDO"]);
export const adminOrderFilterSchema = z.object({ deliveryMode: adminDeliveryModeSchema.optional(), page: z.number().int().positive().optional() });

export type AdminOrderFilter = z.infer<typeof adminOrderFilterSchema>;
export type AdminDeliveryMode = DeliveryMode;
export type DeliverySummary = { hasImmediate: boolean; hasBackorder: boolean; isMixed: boolean };
export type RetryResult =
  | { status: "SENT"; providerMessageRef?: string }
  | { status: "FAILED"; errorCode: string; errorMessage: string }
  | { status: "NOT_CONFIGURED" }
  | { status: "ALREADY_SENT" };
