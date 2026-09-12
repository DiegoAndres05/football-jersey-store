import { test } from "node:test";
import assert from "node:assert/strict";
import {
  productImageAlt,
  leagueLogoAlt,
} from "../src/features/seo/domain/product-image-alt.ts";

test("productImageAlt: image with altText returns that altText", () => {
  const result = productImageAlt(
    { altText: "Camiseta oficial 2025" },
    { name: "Camiseta Barcelona", team: { name: "FC Barcelona" } },
  );
  assert.equal(result, "Camiseta oficial 2025");
});

test("productImageAlt: image without altText + product with team", () => {
  const result = productImageAlt(
    { altText: null },
    { name: "Camiseta Barcelona", team: { name: "FC Barcelona" } },
  );
  assert.equal(result, "Camiseta Barcelona FC Barcelona");
});

test("productImageAlt: image without altText + product without team", () => {
  const result = productImageAlt(
    { altText: null },
    { name: "Camiseta Genérica" },
  );
  assert.equal(result, "Camiseta Genérica");
});

test("leagueLogoAlt: returns 'Camisetas de {leagueName}'", () => {
  assert.equal(leagueLogoAlt("Premier League"), "Camisetas de Premier League");
});

test("leagueLogoAlt: handles empty string league name", () => {
  assert.equal(leagueLogoAlt(""), "Camisetas de ");
});
