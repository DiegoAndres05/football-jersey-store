import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { listAdminOrders } from "../src/features/orders/repositories/admin-order-repository.ts";
import { normalizeAdminDeliveryMode } from "../src/features/orders/repositories/admin-order-repository.ts";
import { sendOrderNotification } from "../src/features/notifications/repositories/notification-attempt-repository.ts";

async function withOrder(run: (orderId: string) => Promise<void>) {
  const code = `TEST-ADMIN-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const order = await prisma.order.create({
    data: {
      code,
      customerName: "Cliente admin de prueba",
      customerEmail: "admin@example.test",
      customerPhone: "3000000000",
      subtotal: 30000,
      total: 30000,
      shippingFullName: "Cliente admin de prueba",
      shippingPhone: "3000000000",
      shippingLine1: "Calle de prueba",
      shippingCity: "Bogotá",
      shippingState: "Cundinamarca",
      items: {
        create: [
          { productName: "Inmediata", teamName: "Equipo", versionName: "Local", sizeName: "M", unitPrice: 10000, quantity: 1, subtotal: 10000, deliveryMode: "INMEDIATA" },
          { productName: "Bajo pedido", teamName: "Equipo", versionName: "Visitante", sizeName: "L", unitPrice: 20000, quantity: 1, subtotal: 20000, deliveryMode: "BAJO_PEDIDO" },
          { productName: "Histórica", teamName: "Equipo", versionName: "Antigua", sizeName: "S", unitPrice: 0, quantity: 1, subtotal: 0, deliveryMode: "NO_DISPONIBLE" },
        ],
      },
    },
  });
  try {
    await run(order.id);
  } finally {
    await prisma.notificationAttempt.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  }
}

test("modalidad histórica ausente se proyecta como NO_DISPONIBLE", () => {
  assert.equal(normalizeAdminDeliveryMode(null), "NO_DISPONIBLE");
  assert.equal(normalizeAdminDeliveryMode("valor-desconocido"), "NO_DISPONIBLE");
});

test("proyección admin deriva resumen mixto y filtros inclusivos", async () => {
  await withOrder(async (orderId) => {
    const all = await listAdminOrders();
    const projected = all.find((order) => order.id === orderId);
    assert.ok(projected);
    assert.deepEqual(projected.deliverySummary, { hasImmediate: true, hasBackorder: true, isMixed: true });
    assert.deepEqual(projected.items.map((item) => item.deliveryMode), ["INMEDIATA", "BAJO_PEDIDO", "NO_DISPONIBLE"]);

    assert.equal((await listAdminOrders("INMEDIATA")).some((order) => order.id === orderId), true);
    assert.equal((await listAdminOrders("BAJO_PEDIDO")).some((order) => order.id === orderId), true);
  });
});

test("persistencia evita segundo envío cuando el intento ya está SENT", async () => {
  await withOrder(async (orderId) => {
    let sends = 0;
    const transport = { sendMessage: async () => { sends += 1; return { status: "SENT" as const, providerMessageRef: "42" }; } };
    const first = await sendOrderNotification(orderId, transport, "mensaje");
    const second = await sendOrderNotification(orderId, transport, "mensaje");
    const attempt = await prisma.notificationAttempt.findUnique({ where: { idempotencyKey: `${orderId}:TELEGRAM:ORDER_CREATED_PAID` } });
    assert.equal(first.status, "SENT");
    assert.deepEqual(second, { status: "ALREADY_SENT" });
    assert.equal(sends, 1);
    assert.equal(attempt?.attemptCount, 1);
    assert.equal(attempt?.status, "SENT");
  });
});
