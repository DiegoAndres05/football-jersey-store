import test from "node:test";
import assert from "node:assert/strict";
import { samePendingOrder } from "../src/features/orders/domain/pending-order-reuse.ts";

const line = {
  variantId: "v1",
  quantity: 1,
  customizationType: "NONE",
  customizationName: "",
  customizationNumber: "",
  deliveryMode: "BAJO_PEDIDO",
};

const money = {
  subtotal: 85000,
  shippingFee: 15000,
  discountAmount: 0,
  total: 100000,
  saleCurrency: "COP",
};

test("el mismo pedido pendiente se reutiliza si líneas y total no cambian", () => {
  assert.equal(samePendingOrder({
    existingLines: [line],
    nextLines: [{ ...line, customizationName: null }],
    existingMoney: money,
    nextMoney: money,
  }), true);
});

test("un carrito distinto no reutiliza el pedido reservado", () => {
  assert.equal(samePendingOrder({
    existingLines: [line],
    nextLines: [{ ...line, quantity: 2 }],
    existingMoney: money,
    nextMoney: money,
  }), false);
});
