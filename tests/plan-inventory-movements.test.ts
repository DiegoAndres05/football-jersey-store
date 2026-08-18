import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planInventoryMovements } from "@/features/orders/repositories/inventory-plan";

const stockById = (stock: Record<string, number>) => new Map(Object.entries(stock));

describe("planInventoryMovements", () => {
  it("reserva solo líneas INMEDIATA", () => {
    const result = planInventoryMovements(
      [
        { variantId: "a", quantity: 2, deliveryMode: "INMEDIATA" },
        { variantId: "b", quantity: 1, deliveryMode: "BAJO_PEDIDO" },
        { variantId: "c", quantity: 3, deliveryMode: "INMEDIATA" },
      ],
      stockById({ a: 5, c: 10 }),
    );
    assert.deepEqual(result, {
      ok: true,
      movements: [
        { variantId: "a", quantity: -2 },
        { variantId: "c", quantity: -3 },
      ],
    });
  });

  it("rechaza si el stock no alcanza para una línea INMEDIATA", () => {
    const result = planInventoryMovements(
      [{ variantId: "a", quantity: 3, deliveryMode: "INMEDIATA" }],
      stockById({ a: 2 }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /Bajo pedido/);
  });

  it("línea INMEDIATA sin stock registrado se trata como stock 0", () => {
    const result = planInventoryMovements(
      [{ variantId: "zz", quantity: 1, deliveryMode: "INMEDIATA" }],
      stockById({}),
    );
    assert.equal(result.ok, false);
  });

  it("no reserva nada si todas las líneas son BAJO_PEDIDO (aunque no haya stock)", () => {
    const result = planInventoryMovements(
      [
        { variantId: "a", quantity: 4, deliveryMode: "BAJO_PEDIDO" },
        { variantId: "b", quantity: 1, deliveryMode: "BAJO_PEDIDO" },
      ],
      stockById({}),
    );
    assert.deepEqual(result, { ok: true, movements: [] });
  });

  it("valida cantidad exacta (stock == quantity es válido)", () => {
    const result = planInventoryMovements(
      [{ variantId: "a", quantity: 2, deliveryMode: "INMEDIATA" }],
      stockById({ a: 2 }),
    );
    assert.deepEqual(result, {
      ok: true,
      movements: [{ variantId: "a", quantity: -2 }],
    });
  });
});