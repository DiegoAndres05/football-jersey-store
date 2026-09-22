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

  it("rejects remote websocket endpoints", () => {
    assert.equal(
      describeFkaBrowserMode({ endpoint: "wss://chrome.example.com/cdp", token: "secret" }),
      "none",
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

  it("enables the importer in development when explicitly enabled", () => {
    assert.equal(
      isFkaImporterEnabled({ NODE_ENV: "development", FKA_IMPORTER_ENABLED: "true" }),
      true,
    );
  });

  it("always disables the importer in production", () => {
    assert.equal(
      isFkaImporterEnabled({ NODE_ENV: "production", FKA_IMPORTER_ENABLED: "true" }),
      false,
    );
    assert.equal(
      isFkaImporterEnabled({ NODE_ENV: "production", FKA_IMPORTER_ENABLED: "false" }),
      false,
    );
  });

  it("disables the importer when the feature flag is false", () => {
    assert.equal(
      isFkaImporterEnabled({ NODE_ENV: "development", FKA_IMPORTER_ENABLED: "false" }),
      false,
    );
  });

  it("strips image content-type parameters", () => {
    assert.equal(normalizeImageContentType("image/jpeg; charset=utf-8"), "image/jpeg");
  });
});
