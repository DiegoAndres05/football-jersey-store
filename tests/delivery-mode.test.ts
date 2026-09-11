import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAvailableDeliveryModes,
  resolveDeliveryModeSelection,
} from "@/features/products/types/delivery-mode";

describe("getAvailableDeliveryModes", () => {
  it("con stock ofrece INMEDIATA (+ BAJO_PEDIDO si permite backorder)", () => {
    assert.deepEqual(getAvailableDeliveryModes(5, true), ["INMEDIATA", "BAJO_PEDIDO"]);
    assert.deepEqual(getAvailableDeliveryModes(5, false), ["INMEDIATA"]);
  });

  it("sin stock ofrece BAJO_PEDIDO solo si permite backorder", () => {
    assert.deepEqual(getAvailableDeliveryModes(0, true), ["BAJO_PEDIDO"]);
    assert.deepEqual(getAvailableDeliveryModes(0, false), []);
  });

  it("stock nulo se trata como sin stock", () => {
    assert.deepEqual(getAvailableDeliveryModes(null, true), ["BAJO_PEDIDO"]);
    assert.deepEqual(getAvailableDeliveryModes(null, false), []);
  });

  it("stock negativo se trata como sin stock", () => {
    assert.deepEqual(getAvailableDeliveryModes(-3, true), ["BAJO_PEDIDO"]);
    assert.deepEqual(getAvailableDeliveryModes(-3, false), []);
  });
});

describe("resolveDeliveryModeSelection", () => {
  it("conserva BAJO_PEDIDO al cambiar a una variante que tambien lo permite", () => {
    assert.equal(
      resolveDeliveryModeSelection("BAJO_PEDIDO", ["INMEDIATA", "BAJO_PEDIDO"]),
      "BAJO_PEDIDO",
    );
  });

  it("usa la primera modalidad disponible si la seleccionada ya no aplica", () => {
    assert.equal(resolveDeliveryModeSelection("BAJO_PEDIDO", ["INMEDIATA"]), "INMEDIATA");
    assert.equal(resolveDeliveryModeSelection("INMEDIATA", ["BAJO_PEDIDO"]), "BAJO_PEDIDO");
    assert.equal(resolveDeliveryModeSelection("INMEDIATA", []), null);
  });
});
