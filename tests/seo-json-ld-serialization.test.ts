import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { serializeJsonLd } from "@/features/seo/domain/serialize-json-ld";

describe("serializeJsonLd", () => {
  it("neutralizes script-closing and HTML payloads while preserving valid JSON", () => {
    const value = {
      name: "</script><script>alert(1)</script>",
      description: '<img src=x onerror=alert(1)>\n<svg onload=alert(1)>',
      special: `" ' & < >`,
      normal: "Camiseta Real Madrid 2025/26",
      unicode: "Camiseta Atlético de Madrid 🔥",
      url: "https://example.com/productos/real-madrid-2025-26",
    };

    const serialized = serializeJsonLd(value);

    assert.doesNotMatch(serialized, /<\/script>/i);
    assert.doesNotMatch(serialized, /<img\b/i);
    assert.doesNotMatch(serialized, /<svg\b/i);
    assert.match(serialized, /\\u003c\/script\\u003e/);
    assert.deepEqual(JSON.parse(serialized), value);
  });

  it("escapes HTML line separators without changing the parsed value", () => {
    const value = { description: "Línea 1\u2028Línea 2\u2029" };
    const serialized = serializeJsonLd(value);

    assert.match(serialized, /\\u2028/);
    assert.match(serialized, /\\u2029/);
    assert.deepEqual(JSON.parse(serialized), value);
  });

  it("rejects values that cannot be serialized as JSON", () => {
    assert.throws(
      () => serializeJsonLd(undefined),
      /JSON-LD value must be JSON-serializable/,
    );
  });
});
