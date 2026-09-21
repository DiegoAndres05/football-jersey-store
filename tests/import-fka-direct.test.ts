import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FkaFetcher } from "../src/features/import/fka/direct.ts";
import { FkaProviderError, fkaErrorUserMessage } from "../src/features/import/fka/http.ts";
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

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": status === 200 ? "text/html" : "text/html" } });
}

function routedFetch(pages: Record<string, { status?: number; body: string }>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const page = pages[url];
    if (!page) return htmlResponse("missing", 404);
    return htmlResponse(page.body, page.status ?? 200);
  }) as typeof fetch;
}

describe("FKA direct HTTP fetcher", () => {
  it("reads a team, season and kit from mocked catalog pages", async () => {
    const fetcher = await FkaFetcher.connect({
      fetchImpl: routedFetch({
        [SEARCH_URL]: {
          body: JSON.stringify({
            data: [{ type: "team", name: "Real Madrid", url: "/es/real-madrid-camisetas-t16/" }],
          }),
        },
        [TEAM_URL]: {
          body: `<html><head><title>Real Madrid - Football Kit Archive</title></head><body>
            <div class="breadcrumbs-container">
              <a href="/es/espana-camisetas/">España</a>
              <a href="/es/la-liga-camisetas-l150/">La Liga</a>
              <a href="/es/real-madrid-camisetas-t16/">Real Madrid</a>
            </div>
            <main>
              <a href="/es/real-madrid-camisetas-2026-27-t16/">2026-27</a>
            </main>
          </body></html>`,
        },
        [SEASON_URL]: {
          body: `<html><head><title>Real Madrid 2026-27</title></head><body><main>
            <a class="kit" href="/es/camiseta-local-real-madrid-2026-27-439615/">Real Madrid 2026-27 Local</a>
            <a class="kit" href="/es/camiseta-visitante-real-madrid-2026-27-440291/">Real Madrid 2026-27 Visitante</a>
          </main></body></html>`,
        },
        [KIT_URL]: {
          body: `<html><head>
            <title>Camiseta Local Real Madrid 2026-27 - Football Kit Archive</title>
            <meta property="og:image" content="https://www.footballkitarchive.com/cdn/2026/06/11/hash/local.jpg" />
          </head><body>
            <table>
              <tr><td>Equipo</td><td>Real Madrid</td></tr>
              <tr><td>Temporada</td><td>2026-27</td></tr>
              <tr><td>Tipo</td><td>Local</td></tr>
            </table>
          </body></html>`,
        },
      }),
    });

    const team = await fetcher.searchTeam("Real Madrid");
    assert.deepEqual(team, { name: "Real Madrid", url: TEAM_URL });

    const teamPage = await fetcher.fetchPage(team!.url);
    const teamId = parseTeamIdFromUrl(teamPage.url);
    assert.equal(teamId, "t16");
    assert.equal(extractTeamContext(teamPage).leagueName, "La Liga");

    const seasonLink = findSeasonLink(teamPage.anchors, teamId!, "2026-27");
    assert.equal(seasonLink, SEASON_URL);

    const seasonPage = await fetcher.fetchPage(seasonLink!);
    const kits = extractKitLinks(seasonPage.anchors, "2026-27");
    assert.equal(kits.length, 2);
    assert.equal(kits[0]?.url, KIT_URL);

    const detail = await fetcher.fetchPage(kits[0]!.url);
    const kit = parseKitDetail(detail);
    assert.equal(kit?.team, "Real Madrid");
    assert.equal(kit?.season, "2026-27");
    assert.equal(kit?.type, "LOCAL");
    assert.equal(kit?.imageUrl, "https://www.footballkitarchive.com/cdn/2026/06/11/hash/local.jpg");
    await fetcher.close();
  });

  it("reports an empty-looking season page without inventing kits", async () => {
    const fetcher = await FkaFetcher.connect({
      fetchImpl: routedFetch({
        [TEAM_URL]: {
          body: `<html><body><main><a href="/es/real-madrid-camisetas-t16/">Real Madrid</a></main></body></html>`,
        },
      }),
    });
    const page = await fetcher.fetchPage(TEAM_URL);
    assert.equal(findSeasonLink(page.anchors, "t16", "2025-26"), null);
  });

  it("turns a catalog 403 into a status diagnostic instead of a generic connection error", async () => {
    const fetcher = await FkaFetcher.connect({
      fetchImpl: routedFetch({
        [SEARCH_URL]: { status: 403, body: "<title>Just a moment...</title>" },
      }),
    });

    await assert.rejects(
      fetcher.searchTeam("Real Madrid"),
      (err) => {
        assert.ok(err instanceof FkaProviderError);
        assert.equal(
          fkaErrorUserMessage(err),
          "Football Kit Archive rechazó la consulta (HTTP 403, verificación Cloudflare).",
        );
        return true;
      },
    );
  });
});
