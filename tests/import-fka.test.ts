import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapKitType,
  normalizeSeason,
  normalizeTitle,
  normalizeTeamName,
  seasonSlug,
  seasonToYear,
  teamSimilarity,
  bestTeamMatch,
} from "../src/features/import/fka/normalizer.ts";
import {
  extractKitLinks,
  findSeasonLink,
  parseKitDetail,
  parseSeasonFromUrl,
  parseTeamIdFromUrl,
} from "../src/features/import/fka/parser.ts";
import {
  resolveImport,
  resolveSeason,
  resolveTeam,
  isDuplicate,
} from "../src/features/import/fka/resolver.ts";
import type { FetchedPage } from "../src/features/import/fka/parser.ts";
import type { FkaKit } from "../src/features/import/fka/types.ts";

// ---------------- NORMALIZADOR: mapeo de tipos ----------------

test("mapKitType: Local → LOCAL", () => {
  assert.equal(mapKitType("Local"), "LOCAL");
  assert.equal(mapKitType("Camiseta Local Real Madrid 2026-27"), "LOCAL");
});

test("mapKitType: Visitante → VISITANTE", () => {
  assert.equal(mapKitType("Visitante"), "VISITANTE");
});

test("mapKitType: Tercera → TERCERA", () => {
  assert.equal(mapKitType("Tercera"), "TERCERA");
});

test("mapKitType: tipos no soportados → null", () => {
  assert.equal(mapKitType("Aniversario"), null);
  assert.equal(mapKitType("PT 1"), null);
  assert.equal(mapKitType("Entrenamiento"), null);
  assert.equal(mapKitType(""), null);
});

// ---------------- NORMALIZADOR: temporadas ----------------

test("normalizeSeason: 2026-27 se mantiene", () => {
  assert.equal(normalizeSeason("2026-27"), "2026-27");
});

test("normalizeSeason: 26-27 corta → 2026-27", () => {
  assert.equal(normalizeSeason("26-27"), "2026-27");
});

test("normalizeSeason: inválida → null", () => {
  assert.equal(normalizeSeason(""), null);
  assert.equal(normalizeSeason("abc"), null);
});

test("seasonToYear y seasonSlug derivan de la temporada", () => {
  assert.equal(seasonToYear("2026-27"), 2026);
  assert.equal(seasonSlug("2026-27"), "26-27");
});

// ---------------- NORMALIZADOR: títulos ----------------

test("normalizeTitle: quita el sufijo de FKA", () => {
  assert.equal(
    normalizeTitle("Camiseta Local Real Madrid 2026-27 - Football Kit Archive"),
    "Camiseta Local Real Madrid 2026-27",
  );
});

// ---------------- NORMALIZADOR: equipos ----------------

test("normalizeTeamName: normaliza acentos y artículos", () => {
  assert.equal(normalizeTeamName("FC Barcelona"), "barcelona");
  assert.equal(normalizeTeamName("Atlético de Madrid"), "atletico madrid");
  assert.equal(normalizeTeamName("Real Madrid"), "real madrid");
});

test("teamSimilarity: reconoce nombres equivalentes", () => {
  assert.equal(teamSimilarity("FC Barcelona", "Barcelona"), 1);
  assert.equal(teamSimilarity("Atlético de Madrid", "Atlético Madrid"), 1);
  assert.ok(teamSimilarity("Real Madrid", "Real Madrid C") > 0.5);
});

test("bestTeamMatch: elige al equipo correcto entre candidatos", () => {
  const candidates = [
    { name: "FC Barcelona" },
    { name: "Atlético de Madrid Mexico" },
    { name: "Paris Saint-Germain" },
  ];
  assert.equal(bestTeamMatch(candidates, "Barcelona")?.name, "FC Barcelona");
  assert.equal(bestTeamMatch(candidates, "PSG")?.name, "Paris Saint-Germain");
  assert.equal(bestTeamMatch(candidates, "Atlético de Madrid"), null);
});

// ---------------- PARSER: URLs y enlaces ----------------

test("parseTeamIdFromUrl: extrae t-id de la URL del equipo", () => {
  assert.equal(parseTeamIdFromUrl("https://www.footballkitarchive.com/es/real-madrid-camisetas-t16/"), "t16");
});

test("parseSeasonFromUrl: extrae temporada de la URL", () => {
  assert.equal(
    parseSeasonFromUrl("https://www.footballkitarchive.com/es/real-madrid-camisetas-2026-27-t16/"),
    "2026-27",
  );
});

test("findSeasonLink: localiza el enlace de temporada en la página del equipo", () => {
  const anchors = [
    { text: "2025-26", href: "https://www.footballkitarchive.com/es/real-madrid-camisetas-2025-26-t16/", className: "" },
    { text: "2026-27", href: "https://www.footballkitarchive.com/es/real-madrid-camisetas-2026-27-t16/", className: "" },
  ];
  assert.equal(findSeasonLink(anchors, "t16", "2026-27"), anchors[1].href);
  assert.equal(findSeasonLink(anchors, "t16", "2030-31"), null);
});

// ---------------- PARSER: enlaces de camisetas (estructura real FKA) ----------------

test("extractKitLinks: filtra enlaces class=kit de la temporada", () => {
  const anchors = [
    { text: "Real Madrid 2026-27 Local", href: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2026-27-439615/", className: "kit" },
    { text: "Real Madrid 2026-27 Visitante", href: "https://www.footballkitarchive.com/es/camiseta-visitante-real-madrid-2026-27-440291/", className: "kit" },
    { text: "Real Madrid 2026-27 Tercera", href: "https://www.footballkitarchive.com/es/tercera-camiseta-real-madrid-2026-27-478371/", className: "kit" },
    { text: "Real Madrid 2026-27 Aniversario", href: "https://www.footballkitarchive.com/es/camiseta-aniversario-real-madrid-2026-27-478832/", className: "kit" },
    { text: "Real Madrid 2025-26 Local", href: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2025-26-1/", className: "kit" },
    { text: "Mostrar todo", href: "https://www.footballkitarchive.com/es/real-madrid-camisetas-2026-27-t16/", className: "" },
  ];
  const links = extractKitLinks(anchors, "2026-27");
  assert.equal(links.length, 3);
  assert.equal(links[0].type, "LOCAL");
  assert.equal(links[1].type, "VISITANTE");
  assert.equal(links[2].type, "TERCERA");
});

test("extractKitLinks: deduplica URLs repetidas", () => {
  const anchors = [
    { text: "Real Madrid 2026-27 Local", href: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2026-27-439615/", className: "kit" },
    { text: "Local", href: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2026-27-439615/", className: "kit" },
  ];
  assert.equal(extractKitLinks(anchors, "2026-27").length, 1);
});

test("extractKitLinks: excluye calentamiento e himno", () => {
  const anchors = [
    { text: "Real Madrid 2026-27 Local", href: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2026-27-439615/", className: "kit" },
    { text: "Real Madrid 2026-27 Calentamiento Local", href: "https://www.footballkitarchive.com/es/camiseta-calentamiento-local-real-madrid-2026-27-1/", className: "kit" },
    { text: "Real Madrid 2026-27 Himno Local", href: "https://www.footballkitarchive.com/es/jacket-himno-local-real-madrid-2026-27-2/", className: "kit" },
    { text: "Real Madrid 2026-27 Visitante", href: "https://www.footballkitarchive.com/es/camiseta-visitante-real-madrid-2026-27-440291/", className: "kit" },
  ];
  const links = extractKitLinks(anchors, "2026-27");
  assert.equal(links.length, 2);
  assert.ok(links.every((l) => !/calentamiento|himno/i.test(l.title)));
});

// ---------------- PARSER: ficha individual ----------------

test("parseKitDetail: extrae title/team/season/type/imageUrl/sourceUrl", () => {
  const page: FetchedPage = {
    url: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2026-27-439615/",
    title: "Camiseta Local Real Madrid 2026-27 - Football Kit Archive",
    anchors: [],
    rows: [
      "Equipo Real Madrid",
      "Temporada 26-27",
      "Tipo Local",
      "Marca adidas",
      "Patrocinador Emirates",
    ],
    images: [
      { src: "data:image/svg+xml", dataSrc: "/cdn/2026/06/11/hash/camiseta-local-real-madrid-2026-27.jpg" },
      { src: "data:image/png", dataSrc: "/cdn/2026/08/04/hash-small/camiseta-visitante-real-madrid-2026-27.jpg" },
    ],
  };
  const kit = parseKitDetail(page);
  assert.ok(kit);
  assert.equal(kit?.title, "Camiseta Local Real Madrid 2026-27");
  assert.equal(kit?.team, "Real Madrid");
  assert.equal(kit?.season, "2026-27");
  assert.equal(kit?.type, "LOCAL");
  assert.equal(kit?.imageUrl, "https://www.footballkitarchive.com/cdn/2026/06/11/hash/camiseta-local-real-madrid-2026-27.jpg");
  assert.equal(kit?.sourceUrl, page.url);
});

test("parseKitDetail: descarta fichas sin datos esenciales", () => {
  const page: FetchedPage = {
    url: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2026-27-439615/",
    title: "Camiseta Local Real Madrid 2026-27",
    anchors: [],
    rows: [],
    images: [],
  };
  assert.equal(parseKitDetail(page), null);
});

// ---------------- RESOLVER: correspondencia con BD (solo lectura) ----------------

const TEAMS = [
  { id: "t1", name: "Real Madrid" },
  { id: "t2", name: "FC Barcelona" },
];
const SEASONS = [
  { id: "s1", name: "Temporada 26/27", slug: "26-27", year: 2026 },
  { id: "s2", name: "Temporada 25/26", slug: "25-26", year: 2025 },
];

test("resolveTeam: encuentra equipo por nombre normalizado", () => {
  assert.equal(resolveTeam(TEAMS, "FC Barcelona")?.id, "t2");
  assert.equal(resolveTeam(TEAMS, "Real Madrid")?.id, "t1");
  assert.equal(resolveTeam(TEAMS, "Girona FC"), null);
});

test("resolveSeason: encuentra temporada por año o slug", () => {
  assert.equal(resolveSeason(SEASONS, "2026-27")?.id, "s1");
  assert.equal(resolveSeason(SEASONS, "26-27")?.id, "s1");
  assert.equal(resolveSeason(SEASONS, "2027-28"), null);
});

test("isDuplicate: detecta producto equivalente", () => {
  const products = [{ id: "p1", teamId: "t1", seasonId: "s1", kitType: "LOCAL" }];
  assert.equal(isDuplicate(products, "t1", "s1", "LOCAL"), true);
  assert.equal(isDuplicate(products, "t1", "s1", "VISITANTE"), false);
});

const KIT: FkaKit = {
  source: "football-kit-archive",
  title: "Camiseta Local Real Madrid 2026-27",
  team: "Real Madrid",
  season: "2026-27",
  type: "LOCAL",
  imageUrl: "https://www.footballkitarchive.com/cdn/2026/06/11/hash/camiseta-local-real-madrid-2026-27.jpg",
  sourceUrl: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2026-27-439615/",
};

test("resolveImport: ENCONTRADO cuando equipo y temporada existen", () => {
  const r = resolveImport(KIT, TEAMS, SEASONS, []);
  assert.equal(r.status, "ENCONTRADO");
  assert.equal(r.teamId, "t1");
  assert.equal(r.seasonId, "s1");
});

test("resolveImport: SIN_EQUIPO cuando no hay correspondencia", () => {
  const kit = { ...KIT, team: "Girona FC" };
  const r = resolveImport(kit, TEAMS, SEASONS, []);
  assert.equal(r.status, "SIN_EQUIPO");
  assert.equal(r.teamId, null);
});

test("resolveImport: SIN_TEMPORADA cuando la temporada no existe", () => {
  const kit = { ...KIT, season: "2027-28" };
  const r = resolveImport(kit, TEAMS, SEASONS, []);
  assert.equal(r.status, "SIN_TEMPORADA");
  assert.equal(r.teamId, "t1");
  assert.equal(r.seasonId, null);
});

test("resolveImport: DUPLICADO cuando ya existe el producto", () => {
  const products = [{ id: "p1", teamId: "t1", seasonId: "s1", kitType: "LOCAL" }];
  const r = resolveImport(KIT, TEAMS, SEASONS, products);
  assert.equal(r.status, "DUPLICADO");
  assert.equal(r.teamId, "t1");
  assert.equal(r.seasonId, "s1");
});