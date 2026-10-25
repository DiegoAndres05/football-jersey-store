import test from "node:test";
import assert from "node:assert/strict";
import { getLegalConfig } from "../src/shared/config/legal.ts";

const published = {
  LEGAL_TERMS_KEY: "terms",
  LEGAL_TERMS_VERSION: "2026-10",
  LEGAL_TERMS_URL: "https://www.flashsports.shop/terminos",
  LEGAL_PRIVACY_KEY: "privacy",
  LEGAL_PRIVACY_VERSION: "2026-10",
  LEGAL_PRIVACY_URL: "https://www.flashsports.shop/privacidad",
  LEGAL_DATA_PROCESSING_KEY: "data-processing",
  LEGAL_DATA_PROCESSING_VERSION: "2026-10",
  LEGAL_DATA_PROCESSING_URL: "https://www.flashsports.shop/tratamiento-datos",
  LEGAL_RETURNS_KEY: "returns",
  LEGAL_RETURNS_VERSION: "2026-10",
  LEGAL_RETURNS_URL: "https://www.flashsports.shop/cambios-devoluciones",
};

test("una url legal con saltos de línea y texto interno vuelve a la ruta pública", () => {
  const legal = getLegalConfig({
    ...published,
    LEGAL_TERMS_URL: "https://www.flashsports.shop/terminos\nLEGAL_PRIVACY_KEY=privacy\nLEGAL_PRIVACY_VERSION=draft\n",
    LEGAL_PRIVACY_VERSION: "draft",
  });
  assert.equal(legal.terms.url, "/terminos");
  assert.equal(legal.terms.documentVersion, "publica");
  assert.equal(legal.privacy.url, "/privacidad");
  assert.equal(legal.privacy.documentVersion, "publica");
  assert.equal(legal.terms.url.includes("LEGAL_"), false);
  assert.equal(legal.terms.url.includes("draft"), false);
});

test("una url https de una sola línea y una versión publicada se conservan", () => {
  const legal = getLegalConfig(published);
  assert.equal(legal.terms.url, "https://www.flashsports.shop/terminos");
  assert.equal(legal.terms.documentVersion, "2026-10");
  assert.equal(legal.privacy.url, "https://www.flashsports.shop/privacidad");
});
