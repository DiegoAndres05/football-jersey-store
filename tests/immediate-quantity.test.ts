import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatReconcileMessage,
  immediateQty,
  maxImmediateForLine,
  reconcileImmediateCart,
  remainingImmediate,
  type ImmediateCartLine,
} from "../src/features/cart/domain/immediate-quantity.ts";

const line = (
  overrides: Partial<ImmediateCartLine> & Pick<ImmediateCartLine, "lineId" | "variantId">,
): ImmediateCartLine => ({
  deliveryMode: "INMEDIATA",
  quantity: 1,
  ...overrides,
});

describe("immediateQty / remainingImmediate", () => {
  it("suma solo líneas INMEDIATA de la misma variante", () => {
    const items = [
      line({ lineId: "a1", variantId: "v1", quantity: 1 }),
      line({ lineId: "a2", variantId: "v1", quantity: 1, deliveryMode: "BAJO_PEDIDO" }),
      line({ lineId: "b1", variantId: "v2", quantity: 3 }),
    ];
    assert.equal(immediateQty(items, "v1"), 1);
    assert.equal(remainingImmediate(items, "v1", 1), 0);
    assert.equal(remainingImmediate(items, "v2", 5), 2);
  });

  it("el tope es por variantId, no por letra de talla", () => {
    const items = [
      line({ lineId: "local-m", variantId: "var-local-m", quantity: 1 }),
      line({ lineId: "player-m", variantId: "var-player-m", quantity: 1 }),
    ];
    assert.equal(remainingImmediate(items, "var-local-m", 1), 0);
    assert.equal(remainingImmediate(items, "var-player-m", 1), 0);
    assert.equal(remainingImmediate(items, "var-local-m", 2), 1);
  });
});

describe("reconcileImmediateCart", () => {
  it("stock 0 elimina líneas INMEDIATA y deja BAJO_PEDIDO", () => {
    const items = [
      line({ lineId: "imm", variantId: "v1", quantity: 2 }),
      line({ lineId: "bo", variantId: "v1", quantity: 4, deliveryMode: "BAJO_PEDIDO" }),
    ];
    const { items: next, adjustments } = reconcileImmediateCart(items, new Map([["v1", 0]]));
    assert.deepEqual(
      next.map((item) => item.lineId),
      ["bo"],
    );
    assert.equal(next[0]?.quantity, 4);
    assert.equal(adjustments.length, 1);
    assert.equal(adjustments[0]?.type, "removed");
  });

  it("recorta desde el final cuando hay varias líneas inmediatas", () => {
    const items = [
      line({ lineId: "first", variantId: "v1", quantity: 1 }),
      line({ lineId: "second", variantId: "v1", quantity: 1 }),
    ];
    const { items: next, adjustments } = reconcileImmediateCart(items, new Map([["v1", 1]]));
    assert.deepEqual(
      next.map((item) => ({ lineId: item.lineId, quantity: item.quantity })),
      [{ lineId: "first", quantity: 1 }],
    );
    assert.equal(adjustments[0]?.type, "removed");
    assert.equal(adjustments[0]?.lineId, "second");
  });

  it("reduce la última línea si su cantidad supera el stock restante", () => {
    const items = [
      line({ lineId: "keep", variantId: "v1", quantity: 1 }),
      line({ lineId: "trim", variantId: "v1", quantity: 3 }),
    ];
    const { items: next, adjustments } = reconcileImmediateCart(items, new Map([["v1", 2]]));
    assert.deepEqual(
      next.map((item) => ({ lineId: item.lineId, quantity: item.quantity })),
      [
        { lineId: "keep", quantity: 1 },
        { lineId: "trim", quantity: 1 },
      ],
    );
    assert.deepEqual(adjustments, [
      { type: "reduced", lineId: "trim", variantId: "v1", from: 3, to: 1 },
    ]);
  });

  it("id ausente en el mapa se trata como stock 0", () => {
    const items = [line({ lineId: "gone", variantId: "missing", quantity: 1 })];
    const { items: next } = reconcileImmediateCart(items, new Map());
    assert.equal(next.length, 0);
  });
});

describe("maxImmediateForLine", () => {
  it("no cuenta la propia línea al calcular el máximo", () => {
    const items = [line({ lineId: "only", variantId: "v1", quantity: 1 })];
    assert.equal(maxImmediateForLine(items, "only", 1), 1);
    assert.equal(maxImmediateForLine(items, "only", 2), 2);
  });
});

describe("formatReconcileMessage", () => {
  it("describe recorte y baja", () => {
    assert.match(formatReconcileMessage([{ type: "removed", lineId: "a", variantId: "v", quantity: 1 }]), /Quitamos/);
    assert.match(
      formatReconcileMessage([{ type: "reduced", lineId: "a", variantId: "v", from: 3, to: 1 }]),
      /Redujimos/,
    );
  });
});
