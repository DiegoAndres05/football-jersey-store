import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  describeFkaBrowserMode,
  isFkaImporterEnabled,
  openFkaBrowser,
} from "../src/features/import/fka/browser-provider.ts";
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

  it("does not use Browserbase when there is no local endpoint", () => {
    assert.equal(describeFkaBrowserMode({}), "none");
  });

  it("never uses loopback CDP in production", () => {
    assert.equal(
      describeFkaBrowserMode({
        endpoint: "http://127.0.0.1:9222",
        nodeEnv: "production",
      }),
      "none",
    );
  });

  it("appends the token to a websocket endpoint", async () => {
    const handle = await openFkaBrowser({ endpoint: "wss://chrome.example.com/cdp", token: "secret" });
    assert.equal(handle.transport, "browser");
    assert.equal(handle.webSocketUrl, "wss://chrome.example.com/cdp?token=secret");
    await handle.close();
  });

  it("fails closed when no local CDP endpoint is configured", async () => {
    await assert.rejects(
      openFkaBrowser({}),
      (err) => {
        assert.ok(err instanceof FkaProviderError);
        assert.match(err.message, /FKA_CDP_ENDPOINT/);
        return true;
      },
    );
  });

  it("enables the importer only when FKA_IMPORTER_ENABLED=true", () => {
    assert.equal(isFkaImporterEnabled({}), false);
    assert.equal(isFkaImporterEnabled({ FKA_IMPORTER_ENABLED: "false" }), false);
    assert.equal(isFkaImporterEnabled({ FKA_IMPORTER_ENABLED: "true" }), true);
  });

  it("strips image content-type parameters", () => {
    assert.equal(normalizeImageContentType("image/jpeg; charset=utf-8"), "image/jpeg");
  });
});
