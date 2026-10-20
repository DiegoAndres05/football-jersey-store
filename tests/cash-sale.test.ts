import assert from "node:assert/strict";
import test from "node:test";
import {
  cashSaleHasStock,
  cashSaleMovementQuantity,
  filterCashCatalog,
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

test("el mostrador filtra por liga y temporada y encuentra el equipo sin acentos", () => {
  const items = [
    { productName: "Local", teamName: "Atlético Nacional", leagueName: "BetPlay", seasonName: "2026", versionName: "Fan", sizeName: "M" },
    { productName: "Visita", teamName: "Millonarios", leagueName: "BetPlay", seasonName: "2025", versionName: "Jugador", sizeName: "L" },
  ];
  const byLeague = filterCashCatalog(items, { query: "", league: "BetPlay", team: "", season: "2026", version: "", size: "" });
  assert.deepEqual(byLeague.items.map((item) => item.teamName), ["Atlético Nacional"]);
  const byName = filterCashCatalog(items, { query: "atletico", league: "", team: "", season: "", version: "", size: "" });
  assert.equal(byName.items.length, 1);
  const many = Array.from({ length: 50 }, (_, index) => ({ ...items[0], productName: `Prenda ${index}`, teamName: `Equipo ${index}` }));
  assert.equal(filterCashCatalog(many, { query: "", league: "", team: "", season: "", version: "", size: "" }).mode, "prompt");
});

test("el vendedor ve ventas en efectivo y no pedidos de tarjeta o PSE", () => {
  assert.equal(orderVisibleToStaff("VENDOR", "CASH"), true);
  assert.equal(orderVisibleToStaff("VENDOR", "CARD"), false);
  assert.equal(orderVisibleToStaff("VENDOR", "PSE"), false);
  assert.equal(orderVisibleToStaff("ADMIN", "CARD"), true);
});
