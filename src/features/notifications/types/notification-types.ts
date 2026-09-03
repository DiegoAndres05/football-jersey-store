export const NOTIFICATION_CHANNEL = "TELEGRAM" as const;
export const ORDER_CREATED_PAID_EVENT = "ORDER_CREATED_PAID" as const;

export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "NOT_CONFIGURED";
export type DeliveryMode = "INMEDIATA" | "BAJO_PEDIDO" | "NO_DISPONIBLE";

export type NotificationResult =
  | { status: "SENT"; providerMessageRef?: string }
  | { status: "FAILED"; errorCode: string; errorMessage: string }
  | { status: "NOT_CONFIGURED" };

export type NotificationEvent = {
  orderId: string;
  orderCode: string;
  createdAt: Date;
  status: string;
  total: number;
  customer: { name: string; email?: string; phone?: string };
  lines: {
    product: string;
    variant?: string;
    size?: string;
    quantity: number;
    deliveryMode: DeliveryMode;
  }[];
};