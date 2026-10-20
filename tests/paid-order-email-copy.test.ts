import assert from "node:assert/strict";
import test from "node:test";
import { formatPaidOrderEmail } from "../src/features/notifications/email/paid-order-email.ts";

const sample = {
  code: "FS-MAIL-1",
  customerName: "Ana",
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
  items: [
    { productName: "Camiseta", versionName: "Local", sizeName: "M", quantity: 1, unitPrice: 100000, subtotal: 100000, deliveryMode: "BAJO_PEDIDO" },
    { productName: "Caja", versionName: "Premium", sizeName: "L", quantity: 1, unitPrice: 100000, subtotal: 100000, deliveryMode: "INMEDIATA" },
  ],
};

test("el correo muestra fechas solo en bajo pedido y el seguimiento por WhatsApp", () => {
  const email = formatPaidOrderEmail(sample);
  assert.match(email.text, /Camiseta · Local · Talla M · x1 · .*Tiempo estimado: 24 de octubre de 2026 – 29 de octubre de 2026/);
  assert.doesNotMatch(email.text, /Caja · Premium[\s\S]*Tiempo estimado/);
  assert.match(email.html, /Tiempo estimado: 24 de octubre de 2026 – 29 de octubre de 2026/);
  assert.match(email.text, /Seguimiento de tu compra/);
  assert.match(email.text, /Escribe con el número de tu pedido/);
  assert.match(email.text, /https:\/\/wa\.me\/573046149525\?text=/);
  assert.match(email.html, /wa\.me\/573046149525/);
  assert.match(email.html, /background-color:#25D366/);
  assert.match(email.html, /Escribir por WhatsApp/);
  assert.match(email.html, /quiero%20el%20seguimiento%20de%20mi%20pedido%20FS-MAIL-1/);
});
