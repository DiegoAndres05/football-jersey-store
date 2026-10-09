import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatOrderNotification } from "../src/features/notifications/services/notification-formatter.ts";
import { createTelegramTransport } from "../src/features/notifications/telegram/telegram-adapter.ts";
import { getTelegramConfig } from "../src/features/notifications/config/telegram-config.ts";
import { notificationIdempotencyKey } from "../src/features/notifications/repositories/notification-attempt-repository.ts";
import type { NotificationEvent } from "../src/features/notifications/types/notification-types.ts";

const event: NotificationEvent = {
  orderId: "order-test",
  orderCode: "FS-TEST-001",
  createdAt: new Date("2026-09-03T12:00:00.000Z"),
  status: "PAID",
  total: 104900,
  customer: { name: "Cliente de prueba", email: "cliente@example.test", phone: "3001112233" },
  shipping: {
    recipient: "Ana Destinataria",
    phone: "3009998877",
    line1: "Calle 1 # 2-3",
    line2: "Apto 4",
    city: "Bogotá",
    state: "Cundinamarca",
    zipCode: "110111",
    country: "Colombia",
    notes: "Portería",
  },
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
  assert.match(message, /Teléfono cliente: 3001112233/);
  assert.match(message, /Quién recibe: Ana Destinataria/);
  assert.match(message, /Teléfono entrega: 3009998877/);
  assert.match(message, /Calle 1 # 2-3/);
  assert.match(message, /Apto 4/);
  assert.match(message, /Bogotá, Cundinamarca/);
  assert.match(message, /CP 110111/);
  assert.match(message, /Colombia/);
  assert.match(message, /Notas: Portería/);
});

test("notifyOrderPaid proyecta los campos de envío del pedido", () => {
  const source = readFileSync("src/features/notifications/services/notification-service.ts", "utf8");
  assert.match(source, /shippingFullName/);
  assert.match(source, /shippingLine1/);
  assert.match(source, /shippingCity/);
  assert.match(source, /customerPhone/);
  assert.match(source, /notes: order\.notes/);
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

    const described = await createTelegramTransport(async () =>
      new Response(JSON.stringify({ ok: false, description: "Forbidden: bot can't initiate conversation with a user" }), { status: 403 }),
    ).sendMessage("mensaje");
    assert.equal(described.status, "FAILED");
    if (described.status === "FAILED") {
      assert.match(described.errorMessage, /can't initiate conversation/);
    }

    process.env.TELEGRAM_BOT_TOKEN = "secret-token-value";
    const leaked = await createTelegramTransport(async () =>
      new Response(JSON.stringify({ ok: false, description: "bad secret-token-value" }), { status: 401 }),
    ).sendMessage("mensaje");
    assert.equal(JSON.stringify(leaked).includes("secret-token-value"), false);
  } finally {
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousChatId === undefined) delete process.env.TELEGRAM_CHAT_ID;
    else process.env.TELEGRAM_CHAT_ID = previousChatId;
  }
});

test("config de Telegram recorta comillas y prefijo bot", () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousChatId = process.env.TELEGRAM_CHAT_ID;
  process.env.TELEGRAM_BOT_TOKEN = `"bot123456:AA-test"`;
  process.env.TELEGRAM_CHAT_ID = `" -100123 "`;
  try {
    assert.deepEqual(getTelegramConfig(), { token: "123456:AA-test", chatId: "-100123" });
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

test("pago aprobado espera notifyOrderPaid en lugar de cortarlo", () => {
  const apply = readFileSync("src/features/orders/services/apply-bold-payment.ts", "utf8");
  assert.match(apply, /await notifyOrderPaid\(order\.id\)/);
  assert.doesNotMatch(apply, /void notifyOrderPaid/);
});

test("reintento del admin usa la server action exportada", () => {
  const detail = readFileSync("src/app/admin/(dashboard)/pedidos/[id]/page.tsx", "utf8");
  assert.match(detail, /retryOrderNotification\.bind\(null, \{ orderId: order\.id \}\)/);
  assert.doesNotMatch(detail, /"use server"; await retryOrderNotification/);
});
