import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { formatPaidOrderEmail, isDeliverableEmail, resolveEmailProductImageUrl } from "../src/features/notifications/email/paid-order-email.ts";
import { createResendTransport } from "../src/features/notifications/email/resend-adapter.ts";
import { EMAIL_CHANNEL, ORDER_PAID_CUSTOMER_EVENT } from "../src/features/notifications/types/notification-types.ts";
import { prisma } from "../src/lib/prisma.ts";
import { sendNotificationAttempt } from "../src/features/notifications/repositories/notification-attempt-repository.ts";

const sample = {
  code: "FS-MAIL-1",
  customerName: "Ana <Cliente>",
  orderedAt: new Date("2026-10-09T18:00:00.000Z"),
  saleCurrency: "COP",
  exchangeRateCopPerUsd: null,
  subtotal: 100000,
  shippingFee: 0,
  discountAmount: 0,
  total: 100000,
  shippingFullName: "Ana Destinataria",
  shippingPhone: "3001112233",
  shippingLine1: "Calle 1 # 2-3",
  shippingLine2: null,
  shippingCity: "Bogotá",
  shippingState: "Cundinamarca",
  shippingZipCode: "110111",
  shippingCountry: "Colombia",
  items: [{ productName: "Camiseta", versionName: "Local", sizeName: "M", quantity: 1, unitPrice: 100000, subtotal: 100000 }],
};

test("el correo de compra pagada incluye productos, totales y dirección", () => {
  const email = formatPaidOrderEmail(sample);
  assert.match(email.subject, /FS-MAIL-1/);
  assert.match(email.text, /Camiseta · Local · Talla M · x1/);
  assert.match(email.text, /Quién recibe: Ana Destinataria/);
  assert.match(email.text, /Calle 1 # 2-3/);
  assert.match(email.text, /COP/);
  assert.match(email.html, /Ana &lt;Cliente&gt;/);
  assert.equal(email.html.includes("<Cliente>"), false);
  assert.match(email.text, /9 de octubre de 2026/);
  assert.match(email.text, /Precio unitario/);
  assert.match(email.html, /https:\/\/www\.flashsports\.shop\/flashsport-logo\.png/);
  assert.match(email.html, /alt="Flashsport"/);
  assert.equal(email.html.includes("localhost"), false);
});

test("el HTML del correo pide esquema claro y fondo blanco explícito", () => {
  const html = formatPaidOrderEmail(sample).html;
  assert.match(html, /<meta name="color-scheme" content="light only">/);
  assert.match(html, /<meta name="supported-color-schemes" content="light">/);
  assert.match(html, /color-scheme: light only/);
  assert.equal(html.includes("mix-blend-mode"), false);
  assert.equal(html.includes("prefers-color-scheme"), false);
  assert.match(html, /bgcolor="#ffffff"/);
  assert.match(html, /background-color:#ffffff/);
  assert.match(html, /color:#141414/);
  assert.match(html, /background-color:#f6f4f2/);
  assert.match(html, /flashsport-logo\.png/);
  assert.equal((html.match(/<table/g) ?? []).length, (html.match(/<\/table>/g) ?? []).length);
  assert.equal((html.match(/<td/g) ?? []).length, (html.match(/<\/td>/g) ?? []).length);
  assert.ok(html.trimEnd().endsWith("</html>"));
});

test("un pedido en USD no se muestra como COP", () => {
  const email = formatPaidOrderEmail({ ...sample, saleCurrency: "USD", exchangeRateCopPerUsd: 4000, total: 400000, subtotal: 400000, items: [{ ...sample.items[0], subtotal: 400000 }] });
  assert.match(email.text, /USD/);
  assert.equal(email.text.includes("COP"), false);
});

test("la fila muestra la imagen pública del producto y sigue completa si falta", () => {
  const withImage = formatPaidOrderEmail({
    ...sample,
    items: [{ ...sample.items[0], imageUrl: "https://cdn.example.test/jersey.png", imageAlt: "Camiseta local" }],
  });
  assert.match(withImage.html, /src="https:\/\/cdn\.example\.test\/jersey\.png"/);
  assert.match(withImage.html, /alt="Camiseta local"/);
  assert.match(withImage.html, /width="72" height="72"/);
  assert.match(withImage.html, /Versión Local/);
  assert.match(withImage.html, /Talla M/);
  assert.match(withImage.html, /Cant\. 1/);
  assert.match(withImage.html, /Precio unitario/);
  assert.match(withImage.html, /Subtotal/);

  const without = formatPaidOrderEmail(sample);
  assert.equal(without.html.includes("cdn.example.test"), false);
  assert.equal(without.html.includes('src=""'), false);
  assert.match(without.html, />Camiseta</);
  assert.match(without.html, /Talla M/);
});

test("la imagen del correo solo acepta una URL https pública", () => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  try {
    assert.equal(
      resolveEmailProductImageUrl({ url: "http://insecure.example/a.jpg", storagePath: "products/1/a.jpg" }),
      "https://project.supabase.co/storage/v1/object/public/product-images/products/1/a.jpg",
    );
    assert.equal(
      resolveEmailProductImageUrl({ url: "https://images.example/a.jpg", storagePath: null }),
      "https://images.example/a.jpg",
    );
    assert.equal(resolveEmailProductImageUrl({ url: "/relative.jpg", storagePath: null }), null);
    assert.equal(resolveEmailProductImageUrl({ url: "https://localhost/a.jpg", storagePath: null }), null);
    assert.equal(resolveEmailProductImageUrl(null), null);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  try {
    assert.equal(
      resolveEmailProductImageUrl({ url: "https://images.example/fallback.jpg", storagePath: "products/1/a.jpg" }),
      "https://images.example/fallback.jpg",
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  }
});

test("el envío toma la imagen principal guardada del producto", () => {
  const source = readFileSync("src/features/notifications/services/order-paid-email.ts", "utf8");
  assert.match(source, /productImage\.findMany/);
  assert.match(source, /isPrimary: "desc"/);
  assert.match(source, /resolveEmailProductImageUrl/);
});

test("sin correo válido no hay destinatario", () => {
  assert.equal(isDeliverableEmail(""), false);
  assert.equal(isDeliverableEmail("no-es-correo"), false);
  assert.equal(isDeliverableEmail("ana@example.test"), true);
});

test("Resend ausente o rechazado no filtra la API key", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.EMAIL_FROM;
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  try {
    const missing = await createResendTransport({ to: "ana@example.test", subject: "s", html: "<p>h</p>" }).sendMessage("texto");
    assert.deepEqual(missing, { status: "NOT_CONFIGURED" });
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = previousFrom;
  }

  process.env.RESEND_API_KEY = "secret-resend-key";
  process.env.EMAIL_FROM = "Flashsport <pedidos@example.test>";
  try {
    const rejected = await createResendTransport(
      { to: "ana@example.test", subject: "s", html: "<p>h</p>" },
      async () => new Response(JSON.stringify({ message: "bad secret-resend-key" }), { status: 422 }),
    ).sendMessage("texto");
    assert.equal(rejected.status, "FAILED");
    assert.equal(JSON.stringify(rejected).includes("secret-resend-key"), false);
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = previousFrom;
  }
});

test("el correo solo se dispara en PAID y se recupera si el pedido ya estaba pagado", () => {
  const apply = readFileSync("src/features/orders/services/apply-bold-payment.ts", "utf8");
  const webhook = readFileSync("src/app/api/webhooks/bold/route.ts", "utf8");
  const reconcile = readFileSync("src/app/api/bold/reconcile/route.ts", "utf8");
  const service = readFileSync("src/features/notifications/services/order-paid-email.ts", "utf8");
  const failedBranch = apply.split('if (toStatus === "PAYMENT_FAILED")')[1] ?? "";
  assert.match(apply, /await sendPaidOrderEmail\(order\.id\)/);
  assert.doesNotMatch(failedBranch, /sendPaidOrderEmail/);
  assert.match(webhook, /current\?\.status === "PAID"/);
  assert.match(webhook, /sendPaidOrderEmail\(current\.id\)/);
  assert.match(reconcile, /await sendPaidOrderEmail\(order\.id\)/);
  assert.match(service, /order\.status !== "PAID"/);
  assert.match(service, /EMAIL_CHANNEL/);
  assert.match(service, /ORDER_PAID_CUSTOMER_EVENT/);
  assert.equal(`${EMAIL_CHANNEL}:${ORDER_PAID_CUSTOMER_EVENT}`, "EMAIL:ORDER_PAID_CUSTOMER");
});

test("un correo SENT no se vuelve a enviar", async () => {
  const code = `TEST-MAIL-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const order = await prisma.order.create({
    data: {
      code,
      status: "PAID",
      customerName: "Cliente correo",
      customerEmail: "cliente@example.test",
      customerPhone: "3000000000",
      subtotal: 10000,
      total: 10000,
      shippingFullName: "Cliente correo",
      shippingPhone: "3000000000",
      shippingLine1: "Calle 1",
      shippingCity: "Bogotá",
      shippingState: "Cundinamarca",
    },
  });
  try {
    let sends = 0;
    const transport = { sendMessage: async () => { sends += 1; return { status: "SENT" as const, providerMessageRef: "email-1" }; } };
    const first = await sendNotificationAttempt({
      orderId: order.id,
      channel: EMAIL_CHANNEL,
      eventKey: ORDER_PAID_CUSTOMER_EVENT,
      transport,
      message: "hola",
    });
    const second = await sendNotificationAttempt({
      orderId: order.id,
      channel: EMAIL_CHANNEL,
      eventKey: ORDER_PAID_CUSTOMER_EVENT,
      transport,
      message: "hola",
    });
    assert.equal(first.status, "SENT");
    assert.deepEqual(second, { status: "ALREADY_SENT" });
    assert.equal(sends, 1);
  } finally {
    await prisma.notificationAttempt.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  }
});
