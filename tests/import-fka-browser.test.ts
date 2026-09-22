import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeFkaBrowserMode, openFkaBrowser } from "../src/features/import/fka/browser-provider.ts";
import { FkaProviderError, fkaErrorUserMessage } from "../src/features/import/fka/http.ts";
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
    const calls: { url: string; method?: string; apiKey?: string | null }[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      calls.push({ url, method: init?.method, apiKey: headers.get("X-BB-API-Key") });
      if (init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        assert.equal(body.proxies, true);
        assert.equal(body.browserSettings.solveCaptchas, true);
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
    assert.equal(calls[0]?.apiKey, "bb_key");
    assert.equal(calls[1]?.method, "DELETE");
    assert.equal(calls[1]?.apiKey, "bb_key");
    assert.match(calls[1]?.url ?? "", /sess_1/);
  });

  it("ignores localhost CDP in production and uses Browserbase", () => {
    assert.equal(
      describeFkaBrowserMode({
        endpoint: "http://127.0.0.1:9222",
        token: "bb_key",
        browserbaseProjectId: "proj",
        nodeEnv: "production",
      }),
      "browserbase",
    );
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

  it("retries a 403 stealth payload and succeeds with a basic session", async () => {
    let posts = 0;
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        posts += 1;
        const body = JSON.parse(String(init.body)) as { proxies?: boolean; projectId?: string };
        if (body.proxies || body.projectId) {
          return new Response("forbidden", { status: 403 });
        }
        return new Response(JSON.stringify({ id: "sess_ok", connectUrl: "wss://connect.browserbase.com/ok" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    const handle = await openFkaBrowser({
      token: "bb_key",
      browserbaseProjectId: "wrong-proj",
      fetchImpl,
    });
    assert.equal(handle.webSocketUrl, "wss://connect.browserbase.com/ok");
    assert.ok(posts >= 2);
    await handle.close();
  });

  it("surfaces Browserbase 401 as a credential error, not FKA", async () => {
    const fetchImpl = (async () => new Response("unauthorized", { status: 401 })) as typeof fetch;
    await assert.rejects(
      openFkaBrowser({ token: "bad", browserbaseProjectId: "proj", fetchImpl }),
      (err) => {
        assert.ok(err instanceof FkaProviderError);
        assert.equal(err.details.status, 401);
        const message = fkaErrorUserMessage(err);
        assert.match(message, /navegador remoto rechazó la API key/);
        assert.equal(message.includes("Football Kit Archive"), false);
        return true;
      },
    );
  });

  it("strips image content-type parameters", () => {
    assert.equal(normalizeImageContentType("image/jpeg; charset=utf-8"), "image/jpeg");
  });
});
