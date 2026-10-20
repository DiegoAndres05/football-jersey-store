import assert from "node:assert/strict";
import test from "node:test";
import {
  cashSaleHasStock,
  cashSaleMovementQuantity,
  isCashOrderHiddenFromPublic,
  orderVisibleToStaff,
  quoteCashSale,
  shouldPersistCashSale,
} from "../src/features/orders/domain/cash-sale.ts";

test("la venta de mostrador cobra el total en pesos y no cobra envío", () => {
  const result = quoteCashSale([
    { variantId: "a", quantity: 2, unitPrice: 50_000 },
    { variantId: "b", quantity: 1, unitPrice: 30_000 },
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.quote.subtotal, 130_000);
  assert.equal(result.quote.shippingFee, 0);
  assert.equal(result.quote.discountAmount, 0);
  assert.equal(result.quote.total, 130_000);
});

test("no confirma si el stock inmediato no alcanza", () => {
  const stock = new Map([["a", 1]]);
  assert.equal(cashSaleHasStock([{ variantId: "a", quantity: 2 }], stock), false);
  assert.equal(cashSaleHasStock([{ variantId: "a", quantity: 1 }], stock), true);
  assert.equal(cashSaleMovementQuantity(1), -1);
});

test("confirmar dos veces con la misma clave no crea otro pedido", () => {
  assert.equal(shouldPersistCashSale(null), true);
  assert.equal(shouldPersistCashSale("FS-2026-10-ABC123"), false);
});

test("el pedido en efectivo no aparece en la confirmación pública", () => {
  assert.equal(isCashOrderHiddenFromPublic("CASH"), true);
  assert.equal(isCashOrderHiddenFromPublic("CARD"), false);
  assert.equal(isCashOrderHiddenFromPublic("PSE"), false);
});

test("el vendedor ve ventas en efectivo y no pedidos de tarjeta o PSE", () => {
  assert.equal(orderVisibleToStaff("VENDOR", "CASH"), true);
  assert.equal(orderVisibleToStaff("VENDOR", "CARD"), false);
  assert.equal(orderVisibleToStaff("VENDOR", "PSE"), false);
  assert.equal(orderVisibleToStaff("ADMIN", "CARD"), true);
});
