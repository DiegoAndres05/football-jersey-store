import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import {
  leagueLogoSrc,
  leagueMonogram,
} from "../src/features/products/domain/league-logos";

const PAGE_PATH = "src/app/page.tsx";

const EXPECTED: Record<string, string> = {
  "premier-league": "/leagues/premier_league.png",
  "la-liga": "/leagues/la_liga.png",
  "serie-a": "/leagues/serie_a.png",
  bundesliga: "/leagues/bundesliga.png",
  "ligue-1": "/leagues/ligue_1.png",
};

const MONOGRAMS: Record<string, string> = {
  "premier-league": "PL",
  "la-liga": "LAL",
  "serie-a": "SA",
  bundesliga: "BL",
  "ligue-1": "L1",
};

test("leagueLogoSrc maps each big-league slug to its public path", () => {
  for (const [slug, path] of Object.entries(EXPECTED)) {
    assert.equal(leagueLogoSrc(slug), path);
  }
  assert.equal(leagueLogoSrc("unknown-league"), null);
});

test("leagueMonogram returns PL/LAL/SA/BL/L1 for known slugs", () => {
  for (const [slug, mono] of Object.entries(MONOGRAMS)) {
    assert.equal(leagueMonogram(slug), mono);
  }
  assert.equal(leagueMonogram("otros", "Otros"), "OTR");
});

test("public league logo files exist", () => {
  for (const path of Object.values(EXPECTED)) {
    const disk = `public${path}`;
    assert.ok(existsSync(disk), `missing ${disk}`);
  }
});

test("homepage Las grandes ligas uses leagueLogoSrc and object-contain", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const domain = readFileSync(
    "src/features/products/domain/league-logos.ts",
    "utf8",
  );
  assert.match(page, /leagueLogoSrc/);
  assert.match(page, /leagueMonogram/);
  assert.match(domain, /\/leagues\//);
  assert.match(page, /object-contain/);
  assert.match(page, /h-11 w-11/);
  assert.match(page, /Las grandes ligas/);
  assert.match(page, /liga=/);
  assert.match(page, /grid-cols-2/);
  assert.match(page, /md:grid-cols-3/);
  assert.match(page, /xl:grid-cols-5/);
  assert.doesNotMatch(page, /cdn\.21st\.dev/);
  assert.doesNotMatch(page, /LEAGUE_MONOGRAMS/);
});
