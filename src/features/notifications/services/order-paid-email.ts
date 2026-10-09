import "server-only";
import { prisma } from "@/lib/prisma";
import { createResendTransport } from "../email/resend-adapter";
import { formatPaidOrderEmail, isDeliverableEmail } from "../email/paid-order-email";
import { sendNotificationAttempt } from "../repositories/notification-attempt-repository";
import { EMAIL_CHANNEL, ORDER_PAID_CUSTOMER_EVENT } from "../types/notification-types";

export async function sendPaidOrderEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    return { status: "FAILED" as const, errorCode: "ORDER_NOT_FOUND", errorMessage: "Pedido no encontrado." };
  }
  if (order.status !== "PAID") {
    return { status: "FAILED" as const, errorCode: "NOT_PAID", errorMessage: "El pedido no está pagado." };
  }

  const formatted = formatPaidOrderEmail({
    code: order.code,
    customerName: order.customerName,
    saleCurrency: order.saleCurrency,
    exchangeRateCopPerUsd: order.exchangeRateCopPerUsd,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discountAmount: order.discountAmount,
    total: order.total,
    shippingFullName: order.shippingFullName,
    shippingPhone: order.shippingPhone,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingZipCode: order.shippingZipCode,
    shippingCountry: order.shippingCountry,
    items: order.items.map((item) => ({
      productName: item.productName,
      versionName: item.versionName,
      sizeName: item.sizeName,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  });
  const to = order.customerEmail.trim();
  const transport = isDeliverableEmail(to)
    ? createResendTransport({ to, subject: formatted.subject, html: formatted.html })
    : { async sendMessage(): Promise<{ status: "NOT_CONFIGURED" }> { return { status: "NOT_CONFIGURED" }; } };

  return sendNotificationAttempt({
    orderId: order.id,
    channel: EMAIL_CHANNEL,
    eventKey: ORDER_PAID_CUSTOMER_EVENT,
    transport,
    message: formatted.text,
  });
}
