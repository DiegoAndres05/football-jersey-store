import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeFkaBrowserMode, openFkaBrowser } from "../src/features/import/fka/browser-provider.ts";
import { FkaProviderError } from "../src/features/import/fka/http.ts";
import { normalizeImageContentType } from "../src/features/import/fka/page-html.ts";

describe("FKA browser provider", () => {
  it("uses local DevTools HTTP for 127.0.0.1:9222", () => {
    assert.equal(describeFkaBrowserMode({ endpoint: "http://127.0.0.1:9222" }), "local-devtools");
  });

  it("uses a direct websocket when the endpoint is wss", () => {
    assert.equal(
      describeFkaBrowserMode({ endpoint: "wss://chrome.example.com/cdp", token: "secret" }),
      "websocket",
    );
  });

  it("uses Browserbase when there is no local/websocket endpoint", () => {
    assert.equal(
      describeFkaBrowserMode({ token: "bb_key", browserbaseProjectId: "proj" }),
      "browserbase",
    );
  });

  it("appends the token to a websocket endpoint", async () => {
    const handle = await openFkaBrowser({ endpoint: "wss://chrome.example.com/cdp", token: "secret" });
    assert.equal(handle.transport, "browser");
    assert.equal(handle.webSocketUrl, "wss://chrome.example.com/cdp?token=secret");
    await handle.close();
  });

  it("creates a Browserbase session and closes it", async () => {
    const calls: { url: string; method?: string }[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, method: init?.method });
      if (init?.method === "POST") {
        return new Response(JSON.stringify({ id: "sess_1", connectUrl: "wss://connect.browserbase.com/sess_1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    const handle = await openFkaBrowser({
      token: "bb_key",
      browserbaseProjectId: "proj",
      fetchImpl,
    });
    assert.equal(handle.transport, "browser");
    assert.equal(handle.webSocketUrl, "wss://connect.browserbase.com/sess_1");
    await handle.close();
    assert.equal(calls[0]?.method, "POST");
    assert.equal(calls[1]?.method, "DELETE");
    assert.match(calls[1]?.url ?? "", /sess_1/);
  });

  it("fails closed when Browserbase credentials are missing", async () => {
    await assert.rejects(
      openFkaBrowser({}),
      (err) => {
        assert.ok(err instanceof FkaProviderError);
        return true;
      },
    );
  });

  it("strips image content-type parameters", () => {
    assert.equal(normalizeImageContentType("image/jpeg; charset=utf-8"), "image/jpeg");
  });
});
