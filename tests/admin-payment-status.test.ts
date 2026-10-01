import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ADMIN_PAYMENT_STATUS_BADGE, adminPaymentStatus } from "../src/features/orders/domain/admin-payment-status";

const paidAt = new Date("2026-09-30T12:00:00.000Z");
const listPage = readFileSync("src/app/admin/(dashboard)/pedidos/page.tsx", "utf8");
const detailPage = readFileSync("src/app/admin/(dashboard)/pedidos/[id]/page.tsx", "utf8");

test("paid and fulfilment statuses show Pagado", () => {
  for (const status of ["PAID", "VALIDATING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED"]) {
    assert.equal(adminPaymentStatus({ status, paidAt }), "paid");
  }
  assert.equal(ADMIN_PAYMENT_STATUS_BADGE.paid.label, "Pagado");
});

test("PENDING_PAYMENT shows Pendiente de pago", () => {
  assert.equal(adminPaymentStatus({ status: "PENDING_PAYMENT", paidAt: null }), "pending");
  assert.equal(ADMIN_PAYMENT_STATUS_BADGE.pending.label, "Pendiente de pago");
});

test("PAYMENT_FAILED shows Rechazado", () => {
  assert.equal(adminPaymentStatus({ status: "PAYMENT_FAILED", paidAt: null }), "failed");
  assert.equal(ADMIN_PAYMENT_STATUS_BADGE.failed.label, "Rechazado");
});

test("cancelled order is unpaid unless it has paidAt", () => {
  assert.equal(adminPaymentStatus({ status: "CANCELLED", paidAt: null }), "cancelled_unpaid");
  assert.equal(adminPaymentStatus({ status: "CANCELLED", paidAt }), "paid");
  assert.equal(adminPaymentStatus({ status: "RETURNED", paidAt }), "paid");
});

test("REFUNDED shows Reembolsado", () => {
  assert.equal(adminPaymentStatus({ status: "REFUNDED", paidAt }), "refunded");
});

test("unknown status is never shown as paid", () => {
  assert.equal(adminPaymentStatus({ status: "SOMETHING_NEW", paidAt: null }), "pending");
});

test("admin order list and detail render the payment status badge", () => {
  assert.match(listPage, /<th className="p-3">Pago<\/th>/);
  assert.match(listPage, /<PaymentStatusBadge order=\{order\} \/>/);
  assert.match(detailPage, /<PaymentStatusBadge order=\{order\} \/>/);
});
