import { test } from "node:test";
import assert from "node:assert/strict";
import { formatOrderNotification } from "../src/features/notifications/services/notification-formatter.ts";
import { createTelegramTransport } from "../src/features/notifications/telegram/telegram-adapter.ts";
import { notificationIdempotencyKey } from "../src/features/notifications/repositories/notification-attempt-repository.ts";
import type { NotificationEvent } from "../src/features/notifications/types/notification-types.ts";

const event: NotificationEvent = {
  orderId: "order-test",
  orderCode: "FS-TEST-001",
  createdAt: new Date("2026-09-03T12:00:00.000Z"),
  status: "PAID",
  total: 104900,
  customer: { name: "Cliente de prueba", email: "cliente@example.test" },
  lines: [
    { product: "Camiseta Colombia", variant: "Local", size: "M", quantity: 2, deliveryMode: "INMEDIATA" },
    { product: "Camiseta Argentina", quantity: 1, deliveryMode: "BAJO_PEDIDO" },
    { product: "Camiseta histórica", quantity: 1, deliveryMode: "NO_DISPONIBLE" },
  ],
};

test("formatter incluye datos del pedido y modalidad por línea", () => {
  const message = formatOrderNotification(event);
  assert.match(message, /FS-TEST-001/);
  assert.match(message, /2026-09-03T12:00:00.000Z/);
  assert.match(message, /Camiseta Colombia \(Local \/ M\) x2: Entrega inmediata/);
  assert.match(message, /Camiseta Argentina x1: Bajo pedido/);
  assert.match(message, /Camiseta histórica x1: No disponible/);
});

test("adaptador Telegram envía sendMessage y referencia de proveedor", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousChatId = process.env.TELEGRAM_CHAT_ID;
  let requestUrl = "";
  let requestBody: { chat_id?: string; text?: string } = {};
  process.env.TELEGRAM_BOT_TOKEN = "test-token";
  process.env.TELEGRAM_CHAT_ID = "test-chat";
  try {
    const transport = createTelegramTransport(async (url, init) => {
      requestUrl = url.toString();
      requestBody = JSON.parse(String(init?.body)) as typeof requestBody;
      return new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), { status: 200 });
    });
    const result = await transport.sendMessage("mensaje de prueba");
    assert.deepEqual(result, { status: "SENT", providerMessageRef: "42" });
    assert.match(requestUrl, /sendMessage$/);
    assert.deepEqual(requestBody, { chat_id: "test-chat", text: "mensaje de prueba" });
  } finally {
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousChatId === undefined) delete process.env.TELEGRAM_CHAT_ID;
    else process.env.TELEGRAM_CHAT_ID = previousChatId;
  }
});

test("adaptador normaliza configuración ausente y errores HTTP sin secretos", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousChatId = process.env.TELEGRAM_CHAT_ID;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  try {
    const result = await createTelegramTransport(async () => new Response("{}", { status: 500 })).sendMessage("mensaje");
    assert.deepEqual(result, { status: "NOT_CONFIGURED" });
  } finally {
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousChatId === undefined) delete process.env.TELEGRAM_CHAT_ID;
    else process.env.TELEGRAM_CHAT_ID = previousChatId;
  }

  process.env.TELEGRAM_BOT_TOKEN = "test-token";
  process.env.TELEGRAM_CHAT_ID = "test-chat";
  try {
    const result = await createTelegramTransport(async () => new Response(JSON.stringify({ ok: false }), { status: 400 })).sendMessage("mensaje");
    assert.deepEqual(result, { status: "FAILED", errorCode: "TELEGRAM_REJECTED", errorMessage: "Telegram rechazó el mensaje." });
    assert.equal(JSON.stringify(result).includes("test-token"), false);
  } finally {
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousChatId === undefined) delete process.env.TELEGRAM_CHAT_ID;
    else process.env.TELEGRAM_CHAT_ID = previousChatId;
  }
});

test("clave de idempotencia es estable por pedido y evento", () => {
  assert.equal(notificationIdempotencyKey("order-test"), "order-test:TELEGRAM:ORDER_CREATED_PAID");
});
