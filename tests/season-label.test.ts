import assert from "node:assert/strict";
import test from "node:test";
import { seasonFilterLabel } from "../src/features/products/domain/season-label.ts";

test("una temporada retro que ya se llama Retro no se duplica", () => {
  assert.equal(seasonFilterLabel({ name: "Retro", isRetro: true }), "Retro");
  assert.equal(seasonFilterLabel({ name: "Retro 2010", isRetro: true }), "Retro 2010");
  assert.equal(seasonFilterLabel({ name: "retro-2012", isRetro: true }), "Retro 2012");
});

test("una temporada vigente conserva su nombre", () => {
  assert.equal(seasonFilterLabel({ name: "Temporada 26/27", isRetro: false }), "Temporada 26/27");
});
