import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  fetchFkaText,
  fkaErrorUserMessage,
  FkaProviderError,
  FKA_USER_AGENT,
} from "../src/features/import/fka/http.ts";
import {
  buildFkaTeamSearchUrl,
  parseFkaTeamSearchResponse,
} from "../src/features/import/fka/search.ts";

function response(body: string, status = 200, headers: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      ...headers,
    },
  });
}

function failingFetch(status: number, body = ""): typeof fetch {
  return (async () => response(body, status, { server: "cloudflare", "cf-ray": "test-ray" })) as typeof fetch;
}

async function assertFkaError(
  promise: Promise<unknown>,
  code: FkaProviderError["code"],
  status?: number,
) {
  await assert.rejects(
    promise,
    (err) => {
      assert.ok(err instanceof FkaProviderError);
      assert.equal(err.code, code);
      if (status) assert.equal(err.details.status, status);
      return true;
    },
  );
}

describe("FKA HTTP client", () => {
  it("returns body for valid 200 response and sends browser-like safe headers", async () => {
    let headers: Headers | undefined;
    const fetchImpl = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      headers = new Headers(init?.headers);
      return response("<html>ok</html>", 200);
    }) as typeof fetch;

    const body = await fetchFkaText("https://www.footballkitarchive.com/es/api/search.php?filter=Real", {
      fetchImpl,
    });

    assert.equal(body, "<html>ok</html>");
    assert.equal(headers?.get("user-agent"), FKA_USER_AGENT);
    assert.equal(headers?.get("referer"), "https://www.footballkitarchive.com/");
    assert.equal(headers?.get("x-requested-with"), "XMLHttpRequest");
  });

  it("maps 403 to FKA_ACCESS_DENIED and captures safe Cloudflare evidence", async () => {
    const warn = mock.method(console, "warn", () => undefined);
    try {
      await assertFkaError(
        fetchFkaText("https://www.footballkitarchive.com/es/real-madrid-camisetas-t16/", {
          fetchImpl: failingFetch(403, "<!doctype html><title>Just a moment...</title>"),
        }),
        "FKA_ACCESS_DENIED",
        403,
      );
      assert.equal(warn.mock.callCount(), 1);
    } finally {
      warn.mock.restore();
    }
  });

  it("maps 404 to FKA_NOT_FOUND", async () => {
    const warn = mock.method(console, "warn", () => undefined);
    try {
      await assertFkaError(fetchFkaText("https://www.footballkitarchive.com/missing", { fetchImpl: failingFetch(404) }), "FKA_NOT_FOUND", 404);
    } finally {
      warn.mock.restore();
    }
  });

  it("maps 429 to FKA_RATE_LIMITED", async () => {
    const warn = mock.method(console, "warn", () => undefined);
    try {
      await assertFkaError(fetchFkaText("https://www.footballkitarchive.com/es/api/search.php?filter=Real", { fetchImpl: failingFetch(429) }), "FKA_RATE_LIMITED", 429);
    } finally {
      warn.mock.restore();
    }
  });

  it("maps 5xx to FKA_TEMPORARY_ERROR", async () => {
    const warn = mock.method(console, "warn", () => undefined);
    try {
      await assertFkaError(fetchFkaText("https://www.footballkitarchive.com/es/", { fetchImpl: failingFetch(503) }), "FKA_TEMPORARY_ERROR", 503);
    } finally {
      warn.mock.restore();
    }
  });

  it("maps timeout to FKA_TIMEOUT", async () => {
    const fetchImpl = ((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })) as typeof fetch;

    await assertFkaError(
      fetchFkaText("https://www.footballkitarchive.com/es/", { fetchImpl, timeoutMs: 1 }),
      "FKA_TIMEOUT",
    );
  });
});

describe("FKA search parser", () => {
  it("builds the current FKA team search URL", () => {
    assert.equal(
      buildFkaTeamSearchUrl("Real Madrid"),
      "https://www.footballkitarchive.com/es/api/search.php?filter=Real%20Madrid",
    );
  });

  it("returns the best team for a valid search with results", () => {
    const team = parseFkaTeamSearchResponse(
      JSON.stringify({
        data: [
          { type: "team", name: "Real Madrid", url: "/es/real-madrid-camisetas-t16/" },
          { type: "team", name: "Real Madrid Castilla", url: "/es/real-madrid-castilla-camisetas-t2216/" },
        ],
      }),
      "Real Madrid",
      buildFkaTeamSearchUrl("Real Madrid"),
    );

    assert.deepEqual(team, {
      name: "Real Madrid",
      url: "https://www.footballkitarchive.com/es/real-madrid-camisetas-t16/",
    });
  });

  it("returns null for a valid search without team results", () => {
    const team = parseFkaTeamSearchResponse(
      JSON.stringify({ data: [{ type: "brand", name: "Real Sport", url: "/es/real-sport-camisetas-b863/" }] }),
      "Real Madrid",
      buildFkaTeamSearchUrl("Real Madrid"),
    );

    assert.equal(team, null);
  });

  it("maps invalid HTML/JSON search payload to FKA_INVALID_RESPONSE", () => {
    assert.throws(
      () => parseFkaTeamSearchResponse("<!doctype html><title>Just a moment...</title>", "Real Madrid", buildFkaTeamSearchUrl("Real Madrid")),
      (err) => err instanceof FkaProviderError && err.code === "FKA_INVALID_RESPONSE",
    );
  });
});

describe("FKA HTTP retries and admin-facing errors", () => {
  it("retries a 403 once with document headers and returns the next successful body", async () => {
    let calls = 0;
    const fetchImpl = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      calls += 1;
      const headers = new Headers(init?.headers);
      if (calls === 1) {
        assert.equal(headers.get("x-requested-with"), "XMLHttpRequest");
        return response("<title>Just a moment...</title>", 403, { server: "cloudflare", "cf-ray": "secret-ray" });
      }
      assert.equal(headers.get("x-requested-with"), null);
      assert.match(headers.get("accept") ?? "", /text\/html/);
      return response("<html>catalog</html>", 200);
    }) as typeof fetch;

    const body = await fetchFkaText("https://www.footballkitarchive.com/es/real-madrid-camisetas-t16/", {
      fetchImpl,
      retryDelayMs: 0,
    });

    assert.equal(body, "<html>catalog</html>");
    assert.equal(calls, 2);
  });

  it("does not retry a 404", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return response("missing", 404);
    }) as typeof fetch;

    await assertFkaError(
      fetchFkaText("https://www.footballkitarchive.com/missing", { fetchImpl, retryDelayMs: 0 }),
      "FKA_NOT_FOUND",
      404,
    );
    assert.equal(calls, 1);
  });

  it("surfaces HTTP 403 and Cloudflare without the URL or ray id", async () => {
    const warn = mock.method(console, "warn", () => undefined);
    try {
      await fetchFkaText("https://www.footballkitarchive.com/es/real-madrid-camisetas-t16/", {
        fetchImpl: failingFetch(403, "<!doctype html><title>Just a moment...</title><p>cf-ray should stay in logs</p>"),
        maxRetries: 0,
      });
      assert.fail("expected FKA error");
    } catch (err) {
      const message = fkaErrorUserMessage(err);
      assert.match(message, /HTTP 403/);
      assert.match(message, /verificación Cloudflare/);
      assert.equal(message.includes("footballkitarchive.com"), false);
      assert.equal(message.includes("cf-ray"), false);
      assert.equal(message.includes("secret"), false);
    } finally {
      warn.mock.restore();
    }
  });

  it("surfaces timeout without a raw exception", async () => {
    const fetchImpl = ((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })) as typeof fetch;

    try {
      await fetchFkaText("https://www.footballkitarchive.com/es/", { fetchImpl, timeoutMs: 1, maxRetries: 0 });
      assert.fail("expected timeout");
    } catch (err) {
      const message = fkaErrorUserMessage(err);
      assert.match(message, /no respondió a tiempo/);
      assert.match(message, /tiempo de espera agotado/);
      assert.equal(message.includes("AbortError"), false);
    }
  });

  it("surfaces a refused connection without the address", async () => {
    const fetchImpl = (async () => {
      const cause = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:9222"), { code: "ECONNREFUSED" });
      throw new TypeError("fetch failed", { cause });
    }) as typeof fetch;

    try {
      await fetchFkaText("https://www.footballkitarchive.com/es/api/search.php?filter=Real", {
        fetchImpl,
        maxRetries: 0,
      });
      assert.fail("expected network error");
    } catch (err) {
      const message = fkaErrorUserMessage(err);
      assert.match(message, /No se pudo conectar con Football Kit Archive \(conexión rechazada\)/);
      assert.equal(message.includes("127.0.0.1"), false);
      assert.equal(message.includes("9222"), false);
      assert.equal(message.includes("footballkitarchive.com"), false);
    }
  });
});
