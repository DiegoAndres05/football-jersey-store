import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("coupon persistence contract has restrictive history and uniqueness constraints", () => {
  const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  assert.match(schema, /code\s+String\s+@unique/);
  assert.match(schema, /onDelete: Restrict/);
  assert.match(schema, /@@unique\(\[couponId, orderId\]\)/);
  assert.match(schema, /@@index\(\[couponId, state, expiresAt\]\)/);
});
