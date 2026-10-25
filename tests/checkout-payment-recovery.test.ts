import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { recoveredCartItems } from "../src/features/payments/recovery.ts";

const checkout = readFileSync("src/features/checkout/components/checkout-page-client.tsx", "utf8");
const confirmation = readFileSync("src/app/pedido/confirmado/[code]/page.tsx", "utf8");

test("recovered cart keeps real lines and drops junk", () => {
  const raw = JSON.stringify({
    orderCode: "FS-1",
    items: [
      { lineId: "v1#none#INMEDIATA", variantId: "v1", productName: "Local", quantity: 1, unitPrice: 100000 },
      { lineId: "", variantId: "v2", productName: "Roto", quantity: 1, unitPrice: 1 },
      { note: "no es una linea" },
    ],
  });
  const items = recoveredCartItems(raw);
  assert.equal(items.length, 1);
  assert.equal(items[0]?.productName, "Local");
  assert.deepEqual(recoveredCartItems("no-json"), []);
  assert.deepEqual(recoveredCartItems(null), []);
});

test("authorizations stay on the form step and leave the payment step", () => {
  assert.match(checkout, /step === "form" && \(\s*<section[\s\S]*?<CheckoutConsents/);
  assert.equal((checkout.match(/<CheckoutConsents/g) ?? []).length, 1);
});

test("closing Bold restores the cart and the form validates while typing", () => {
  assert.match(checkout, /BOLD_CHECKOUT_EVENT/);
  assert.match(checkout, /readRecoveredCartItems\(\)/);
  assert.match(checkout, /replaceItems\(recovered\)/);
  assert.match(checkout, /mode: "onChange"/);
  assert.match(checkout, /Reintentar pago/);
  assert.match(checkout, /Volver al carrito/);
  assert.match(checkout, /Editar datos/);
  assert.doesNotMatch(checkout, /clearCart\(/);
  assert.doesNotMatch(checkout, /bold-tx-status/);
  assert.doesNotMatch(checkout, /setPaymentStatus\("success"\)/);
  const payNow = checkout.slice(checkout.indexOf("const payNow"));
  const shortcut = payNow.indexOf("boldConfigRef.current && hasBoldCheckout()");
  const reserveAgain = payNow.indexOf("await reserveBoldOrder");
  assert.ok(shortcut > 0 && shortcut < reserveAgain, "reintentar reabre Bold antes de crear otro pedido");
});

test("confirmation shows the shipping fee and returns the cart unless the order is paid", () => {
  assert.match(confirmation, /order\.shippingFee/);
  assert.match(confirmation, />Envío</);
  assert.match(confirmation, /RecoverCartUnlessPaid paid=\{uiMode === "paid"\}/);
});
