import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  ORDER_CONFIRMATION_COPY,
  orderConfirmationView,
  shouldReconcileOnConfirmation,
} from "../src/features/orders/domain/order-confirmation-view";

const page = readFileSync("src/app/pedido/confirmado/[code]/page.tsx", "utf8");
const component = readFileSync("src/app/pedido/confirmado/[code]/confirmation-payment-status.tsx", "utf8");
const reconcileRoute = readFileSync("src/app/api/bold/reconcile/route.ts", "utf8");

test("PAID order shows payment success", () => {
  assert.equal(orderConfirmationView("PAID"), "paid");
  for (const status of ["VALIDATING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED"]) {
    assert.equal(orderConfirmationView(status), "paid");
  }
  assert.equal(ORDER_CONFIRMATION_COPY.paid.title, "Pago aprobado");
});

test("PAYMENT_FAILED order shows rejection", () => {
  assert.equal(orderConfirmationView("PAYMENT_FAILED"), "failed");
  assert.equal(ORDER_CONFIRMATION_COPY.failed.title, "Pago rechazado");
});

test("PENDING_PAYMENT order shows the pending confirmation message", () => {
  assert.equal(orderConfirmationView("PENDING_PAYMENT"), "pending");
  assert.equal(orderConfirmationView("SOMETHING_NEW"), "pending");
  assert.equal(ORDER_CONFIRMATION_COPY.pending.banner, "Estamos confirmando tu pago.");
});

test("CANCELLED order shows cancellation", () => {
  assert.equal(orderConfirmationView("CANCELLED"), "cancelled");
  assert.equal(orderConfirmationView("REFUNDED"), "cancelled");
  assert.equal(ORDER_CONFIRMATION_COPY.cancelled.title, "Orden cancelada");
});

test("page renders from the persisted Order status only", () => {
  assert.match(page, /orderConfirmationView\(order\.status\)/);
  assert.match(page, /ORDER_CONFIRMATION_COPY/);
  assert.doesNotMatch(page, /"approved"|"APPROVED"/, "Bold's URL status never decides the result");
});

test("refreshing the page does not modify the Order", () => {
  assert.doesNotMatch(page, /applyBoldPayment|reconcileBoldOrder\(|prisma|\.update\(|\.create\(|fetch\(/);
  assert.match(page, /getOrderByCode\(code\)/);
  assert.equal(shouldReconcileOnConfirmation("paid", true), false);
  assert.equal(shouldReconcileOnConfirmation("failed", true), false);
  assert.equal(shouldReconcileOnConfirmation("cancelled", true), false);
  assert.equal(shouldReconcileOnConfirmation("pending", false), false);
  assert.equal(shouldReconcileOnConfirmation("pending", true), true);
});

test("the frontend cannot turn an Order into PAID", () => {
  const body = component.match(/body:\s*JSON\.stringify\(([^)]+)\)/)?.[1] ?? "";
  assert.equal(body.trim(), "{ orderCode, boldOrderId }");
  assert.doesNotMatch(component, /setMode\("paid"\)|Pago aprobado/);
  assert.match(reconcileRoute, /orderCode: z\.string\(\)/);
  assert.doesNotMatch(reconcileRoute, /body\.status|parsed\.data\.status|returnTxStatus:/);
});

test("confirmation reconcile is bounded to a few seconds, then manual", () => {
  const attempts = Number(component.match(/MAX_AUTO_ATTEMPTS = (\d+)/)?.[1]);
  const delay = Number(component.match(/AUTO_RETRY_DELAY_MS = (\d+)/)?.[1]);
  assert.ok(attempts >= 1 && attempts <= 2, `auto attempts: ${attempts}`);
  assert.ok((attempts - 1) * delay <= 10_000, "automatic checks finish within 10 seconds");
  assert.doesNotMatch(component, /RETRY_DELAYS_MS/);
  assert.match(component, /Verificar de nuevo/);
  assert.match(component, /router\.refresh\(\)/);
});

test("reconcile endpoint still exists and still goes through reconcileBoldOrder", () => {
  assert.match(reconcileRoute, /export async function POST/);
  assert.match(reconcileRoute, /reconcileBoldOrder\(/);
  assert.match(component, /\/api\/bold\/reconcile/);
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

test("applyBoldPayment remains the only payment persistence path", () => {
  const paymentSurfaces = [
    "src/app/pedido",
    "src/app/checkout",
    "src/app/api/bold",
    "src/app/api/webhooks",
    "src/features/payments",
    "src/features/checkout",
  ].flatMap(sourceFiles);
  for (const file of paymentSurfaces) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\border\.(update|updateMany|upsert)\(|orderStatusHistory\.create\(/, `${file} must not persist payment state`);
  }
  const apply = readFileSync("src/features/orders/services/apply-bold-payment.ts", "utf8");
  assert.match(apply, /status: toStatus/);
  assert.match(apply, /current\.status !== "PENDING_PAYMENT"/);
});
