import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

describe("resolvePublicOrigin", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("production (NODE_ENV=production)", () => {
    beforeEach(() => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true, configurable: true });
    });

    it("throws when NEXT_PUBLIC_SITE_URL is missing", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.throws(() => resolvePublicOrigin(), /NEXT_PUBLIC_SITE_URL/);
    });

    it("throws when NEXT_PUBLIC_SITE_URL is empty", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.throws(() => resolvePublicOrigin(), /NEXT_PUBLIC_SITE_URL/);
    });

    it("throws when URL uses HTTP (not HTTPS)", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "http://example.com";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.throws(() => resolvePublicOrigin(), /HTTPS/);
    });

    it("throws when URL is localhost", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://localhost";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.throws(() => resolvePublicOrigin(), /localhost/);
    });

    it("throws when URL is 127.0.0.1", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://127.0.0.1";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.throws(() => resolvePublicOrigin(), /127\.0\.0\.1/);
    });

    it("throws when URL has a path", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com/path";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.throws(() => resolvePublicOrigin(), /path/);
    });

    it("normalizes HTTPS URL with trailing slash", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com/";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.equal(resolvePublicOrigin(), "https://shop.example.com");
    });

    it("returns HTTPS URL as-is", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.equal(resolvePublicOrigin(), "https://shop.example.com");
    });
  });

  describe("development (NODE_ENV=development)", () => {
    beforeEach(() => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true, configurable: true });
    });

    it("returns localhost when NEXT_PUBLIC_SITE_URL is missing", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.equal(resolvePublicOrigin(), "http://localhost:3000");
    });

    it("uses NEXT_PUBLIC_SITE_URL when provided", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.equal(resolvePublicOrigin(), "https://shop.example.com");
    });

    it("allows HTTP localhost in development", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
      const { resolvePublicOrigin } = require("@/shared/config/public-origin");
      assert.equal(resolvePublicOrigin(), "http://localhost:3000");
    });
  });
});
