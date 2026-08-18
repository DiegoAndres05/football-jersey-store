import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAvailableDeliveryModes } from "@/features/products/types/delivery-mode";

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