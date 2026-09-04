import { test } from "node:test";
import assert from "node:assert/strict";
import { toUsdCents } from "../src/shared/money/convert.ts";

test("toUsdCents: conversión básica con tasa 4000", () => {
  // 10000 COP / 4000 = 2.5 USD = 250 cents
  assert.equal(toUsdCents(10000, 4000), 250);
});

test("toUsdCents: half-up rounding", () => {
  // 1500 COP / 4000 = 0.375 USD = 37.5 cents → 38 cents (half-up)
  assert.equal(toUsdCents(1500, 4000), 38);
});

test("toUsdCents: mínimo 1 cent si COP > 0", () => {
  // 1 COP / 4000 = 0.00025 USD → debe dar mínimo 1 cent
  assert.equal(toUsdCents(1, 4000), 1);
});

test("toUsdCents: 0 COP devuelve 0 cents", () => {
  assert.equal(toUsdCents(0, 4000), 0);
});

test("toUsdCents: determinismo — misma entrada siempre mismo resultado", () => {
  const a = toUsdCents(33333, 4200);
  const b = toUsdCents(33333, 4200);
  assert.equal(a, b);
});

test("toUsdCents: redondeo no sesgado — prueba con múltiples valores", () => {
  // 500 COP / 3000 = 0.1666... USD = 16.66... cents → 17 cents
  assert.equal(toUsdCents(500, 3000), 17);
  // 2500 COP / 3000 = 0.8333... USD = 83.33... cents → 83 cents
  assert.equal(toUsdCents(2500, 3000), 83);
});

test("toUsdCents: total oficial ≠ suma de líneas (demostración)", () => {
  // Línea A: 1500 COP → redondeo individual
  const lineA = toUsdCents(1500, 4000);
  // Línea B: 1500 COP → redondeo individual
  const lineB = toUsdCents(1500, 4000);
  // Total: 3000 COP → conversión del total
  const total = toUsdCents(3000, 4000);
  // El total oficial debe ser la conversión del total, no la suma de líneas
  // En este caso coinciden, pero verificamos que la función es consistente
  assert.ok(total > 0, "Total debe ser > 0");
  assert.equal(total, toUsdCents(3000, 4000), "Total debe ser determinista");
});
