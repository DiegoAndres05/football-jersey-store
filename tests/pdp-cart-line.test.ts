import test from "node:test";
import assert from "node:assert/strict";
import { normalizePersonalization, personalizationSurcharge, validatePersonalization } from "@/features/products/personalization";
import { buildLineId } from "@/shared/stores/cart-store";

test("normaliza y valida personalización personalizada", () => {
  const result = validatePersonalization({ type: "CUSTOM", name: "  diego  ", number: "10" });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, { type: "CUSTOM", name: "DIEGO", number: "10" });
  assert.equal(personalizationSurcharge("CUSTOM", 25000), 25000);
});

test("rechaza nombre/número inválidos y exige jugador oficial", () => {
  assert.equal(validatePersonalization({ type: "CUSTOM", name: "a".repeat(16), number: "100" }).ok, false);
  assert.equal(validatePersonalization({ type: "OFFICIAL_PLAYER" }).ok, false);
  assert.equal(validatePersonalization({ type: "OFFICIAL_PLAYER", playerId: "p1" }, { officialPlayer: { id: "p1", name: "Messi", number: "10" } }).ok, true);
});

test("la línea distingue modalidad y personalización", () => {
  const base = { variantId: "v1", customizationType: "CUSTOM" as const, customizationName: "DIEGO", customizationNumber: "10" };
  assert.notEqual(buildLineId({ ...base, deliveryMode: "INMEDIATA" }), buildLineId({ ...base, deliveryMode: "BAJO_PEDIDO" }));
  assert.equal(normalizePersonalization({}).type, "NONE");
});
