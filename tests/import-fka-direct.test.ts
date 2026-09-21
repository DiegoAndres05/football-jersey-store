import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseFetchedPage } from "../src/features/import/fka/page-html.ts";
import { parseFkaTeamSearchResponse } from "../src/features/import/fka/search.ts";
import { FkaProviderError } from "../src/features/import/fka/http.ts";
import {
  extractKitLinks,
  extractTeamContext,
  findSeasonLink,
  parseKitDetail,
  parseTeamIdFromUrl,
} from "../src/features/import/fka/parser.ts";

const SEARCH_URL = "https://www.footballkitarchive.com/es/api/search.php?filter=Real%20Madrid";
const TEAM_URL = "https://www.footballkitarchive.com/es/real-madrid-camisetas-t16/";
const SEASON_URL = "https://www.footballkitarchive.com/es/real-madrid-camisetas-2026-27-t16/";
const KIT_URL = "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2026-27-439615/";

describe("FKA HTML/search parsers used by CDP FkaFetcher", () => {
  it("reads a team, season and kit from catalog HTML", () => {
    const team = parseFkaTeamSearchResponse(
      JSON.stringify({
        data: [{ type: "team", name: "Real Madrid", url: "/es/real-madrid-camisetas-t16/" }],
      }),
      "Real Madrid",
      SEARCH_URL,
    );
    assert.deepEqual(team, { name: "Real Madrid", url: TEAM_URL });

    const teamPage = parseFetchedPage(
      `<html><head><title>Real Madrid - Football Kit Archive</title></head><body>
        <div class="breadcrumbs-container">
          <a href="/es/espana-camisetas/">España</a>
          <a href="/es/la-liga-camisetas-l150/">La Liga</a>
          <a href="/es/real-madrid-camisetas-t16/">Real Madrid</a>
        </div>
        <main>
          <a href="/es/real-madrid-camisetas-2026-27-t16/">2026-27</a>
        </main>
      </body></html>`,
      TEAM_URL,
    );
    const teamId = parseTeamIdFromUrl(teamPage.url);
    assert.equal(teamId, "t16");
    assert.equal(extractTeamContext(teamPage).leagueName, "La Liga");

    const seasonLink = findSeasonLink(teamPage.anchors, teamId!, "2026-27");
    assert.equal(seasonLink, SEASON_URL);

    const seasonPage = parseFetchedPage(
      `<html><head><title>Real Madrid 2026-27</title></head><body><main>
        <a class="kit" href="/es/camiseta-local-real-madrid-2026-27-439615/">Real Madrid 2026-27 Local</a>
        <a class="kit" href="/es/camiseta-visitante-real-madrid-2026-27-440291/">Real Madrid 2026-27 Visitante</a>
      </main></body></html>`,
      SEASON_URL,
    );
    const kits = extractKitLinks(seasonPage.anchors, "2026-27");
    assert.equal(kits.length, 2);
    assert.equal(kits[0]?.url, KIT_URL);

    const detail = parseFetchedPage(
      `<html><head>
        <title>Camiseta Local Real Madrid 2026-27 - Football Kit Archive</title>
        <meta property="og:image" content="https://www.footballkitarchive.com/cdn/2026/06/11/hash/local.jpg" />
      </head><body>
        <table>
          <tr><td>Equipo</td><td>Real Madrid</td></tr>
          <tr><td>Temporada</td><td>2026-27</td></tr>
          <tr><td>Tipo</td><td>Local</td></tr>
        </table>
      </body></html>`,
      KIT_URL,
    );
    const kit = parseKitDetail(detail);
    assert.equal(kit?.team, "Real Madrid");
    assert.equal(kit?.season, "2026-27");
    assert.equal(kit?.type, "LOCAL");
    assert.equal(kit?.imageUrl, "https://www.footballkitarchive.com/cdn/2026/06/11/hash/local.jpg");
  });

  it("reports an empty-looking season page without inventing kits", () => {
    const page = parseFetchedPage(
      `<html><body><main><a href="/es/real-madrid-camisetas-t16/">Real Madrid</a></main></body></html>`,
      TEAM_URL,
    );
    assert.equal(findSeasonLink(page.anchors, "t16", "2025-26"), null);
  });

  it("turns invalid search JSON into FKA_INVALID_RESPONSE", () => {
    assert.throws(
      () => parseFkaTeamSearchResponse("<title>Just a moment...</title>", "Real Madrid", SEARCH_URL),
      (err: unknown) => {
        assert.ok(err instanceof FkaProviderError);
        assert.equal(err.code, "FKA_INVALID_RESPONSE");
        return true;
      },
    );
  });
});
