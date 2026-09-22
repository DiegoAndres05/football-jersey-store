import { test } from "node:test";
import assert from "node:assert/strict";
import { buildContentSecurityPolicy } from "../src/shared/security/content-security-policy.ts";

const policy = buildContentSecurityPolicy({ nonce: "abc123==" });

test("CSP report policy keeps Bold checkout and Supabase images", () => {
  assert.match(policy, /script-src 'self' 'nonce-abc123==' 'strict-dynamic' https:\/\/checkout\.bold\.co/);
  assert.match(policy, /frame-src 'self' https:\/\/checkout\.bold\.co/);
  assert.match(policy, /img-src 'self' data: https:\/\/images\.unsplash\.com https:\/\/plus\.unsplash\.com https:\/\/xmsreelwxwqjzgtkxcje\.supabase\.co/);
  assert.match(policy, /connect-src 'self'/);
  assert.equal(policy.includes("unsafe-inline"), false);
  assert.equal(policy.includes("footballkitarchive"), false);
  assert.equal(policy.includes("localhost"), false);
  assert.equal(policy.includes("telegram"), false);
  assert.equal(policy.includes("payments.api.bold.co"), false);
});

test("CSP adds unsafe-eval only for the dev bundler", () => {
  const dev = buildContentSecurityPolicy({ nonce: "abc", isDev: true });
  assert.match(dev, /'unsafe-eval'/);
  assert.equal(policy.includes("unsafe-eval"), false);
});
