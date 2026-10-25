import test from "node:test";
import assert from "node:assert/strict";
import { publicShippingCopy } from "../src/features/products/domain/shipping-promise.ts";

test("bajo pedido no promete despacho de 1–2 días y muestra el costo", () => {
  const copy = publicShippingCopy({
    mode: "BAJO_PEDIDO",
    availableModes: ["BAJO_PEDIDO"],
    nationalFeeCop: 15000,
    freeThresholdCop: 200000,
  });
  assert.match(copy.message, /15–20 días/);
  assert.match(copy.fee, /\$15\.000/);
  assert.match(copy.fee, /\$200\.000/);
  assert.doesNotMatch(copy.message, /1–2|1-2|24–48|24-48/);
});

test("entrega inmediata usa el mismo costo y su propio tiempo", () => {
  const copy = publicShippingCopy({
    mode: "INMEDIATA",
    availableModes: ["INMEDIATA"],
    nationalFeeCop: 15000,
  });
  assert.match(copy.time, /24–48/);
  assert.match(copy.fee, /\$15\.000/);
  assert.match(copy.fee, /\$200\.000/);
});

test("si hay dos modalidades y ninguna elegida, no se promete el despacho rápido", () => {
  const copy = publicShippingCopy({
    mode: null,
    availableModes: ["INMEDIATA", "BAJO_PEDIDO"],
    nationalFeeCop: 15000,
  });
  assert.match(copy.time, /modalidad/);
  assert.doesNotMatch(copy.message, /24–48|15–20|1–2/);
  assert.match(copy.fee, /\$15\.000/);
});

test("tarifa cero se dice como envío nacional gratis", () => {
  const copy = publicShippingCopy({
    mode: "INMEDIATA",
    availableModes: ["INMEDIATA"],
    nationalFeeCop: 0,
  });
  assert.equal(copy.fee, "Envío nacional gratis.");
});
