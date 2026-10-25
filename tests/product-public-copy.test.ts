import assert from "node:assert/strict";
import test from "node:test";
import {
  kitTypeLabel,
  productEyebrowParts,
  productFallbackDescription,
  seasonInSentence,
} from "../src/features/products/domain/product-public-copy.ts";

test("el tipo de camiseta se lee en minúscula inicial", () => {
  assert.equal(kitTypeLabel("LOCAL"), "Local");
  assert.equal(kitTypeLabel("VISITANTE"), "Visitante");
  assert.equal(kitTypeLabel("TERCERA"), "Tercera");
});

test("la frase de temporada no repite la palabra", () => {
  assert.equal(seasonInSentence("Temporada 26/27"), "Temporada 26/27");
  assert.equal(seasonInSentence("26/27"), "temporada 26/27");
});

test("la ceja omite la marca cuando no existe", () => {
  assert.deepEqual(
    productEyebrowParts({
      teamName: "AC Milan",
      brand: null,
      leagueName: "Serie A",
      seasonName: "Temporada 26/27",
    }),
    ["AC Milan", "Serie A", "Temporada 26/27"],
  );
  assert.deepEqual(
    productEyebrowParts({
      teamName: "AC Milan",
      brand: "Adidas",
      leagueName: "Serie A",
      seasonName: "Temporada 26/27",
    }),
    ["AC Milan", "Adidas", "Serie A", "Temporada 26/27"],
  );
});

test("la descripción de respaldo no deja el tipo en mayúsculas ni duplica temporada", () => {
  assert.equal(
    productFallbackDescription({
      teamName: "AC Milan",
      seasonName: "Temporada 26/27",
      kitType: "LOCAL",
      leagueName: "Serie A",
    }),
    "Camiseta de fútbol de AC Milan, Temporada 26/27. Tipo: Local. Liga: Serie A.",
  );
});

test("una descripción propia se conserva", () => {
  assert.equal(
    productFallbackDescription({
      description: "  Edición limitada. ",
      teamName: "AC Milan",
      seasonName: "Temporada 26/27",
      kitType: "LOCAL",
    }),
    "Edición limitada.",
  );
});
