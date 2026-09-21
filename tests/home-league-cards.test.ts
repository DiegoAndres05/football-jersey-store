import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { BIG_LEAGUE_SLUGS, leagueLogo } from "../src/features/products/domain/league-logos";

const page = readFileSync("src/app/page.tsx", "utf8");
const card = readFileSync("src/components/home/league-card.tsx", "utf8");

test("the home maps every configured big league through LeagueCard", () => {
  assert.match(page, /BIG_LEAGUES\.map/);
  assert.match(page, /<LeagueCard/);
  assert.match(page, /slug=\{league\.slug\}/);
  assert.match(page, /imageClassName="h-full w-full object-contain"/);
  assert.match(page, /grid-cols-2/);
  assert.match(page, /md:grid-cols-3/);
  assert.match(page, /xl:grid-cols-5/);
  assert.doesNotMatch(page, /href=\{`\/ligas\/\$\{league\.slug\}`\}/);
  assert.ok(BIG_LEAGUE_SLUGS.includes("serie-a"));
});

test("each card preserves identity, count/status, navigation, and focus states", () => {
  assert.match(card, /href=\{`\/ligas\/\$\{slug\}`\}/);
  assert.match(card, /aria-label=\{`\$\{displayName\}, \$\{productStatus\}\. Ver liga`\}/);
  assert.match(card, /focus-visible:ring-2/);
  assert.match(card, /productCount > 0/);
  assert.match(card, /Próximamente/);
  assert.match(card, /Ver liga/);
  assert.doesNotMatch(card, /\/ligas\/serie-a/);
});

test("missing logos have a neutral accessible fallback without losing the card data", () => {
  const fallback = leagueLogo("new-league", "Nueva liga");
  assert.equal(fallback.src, null);
  assert.equal(fallback.fallbackLabel, "Logo no disponible para Nueva liga");
  assert.match(card, /role=\{!hasLogo \? "img" : undefined\}/);
  assert.match(card, /Shield/);
  assert.match(card, /onError=\{\(\) => setLogoFailed\(true\)\}/);
  assert.match(card, /alt=\{logoAlt\}/);
});
