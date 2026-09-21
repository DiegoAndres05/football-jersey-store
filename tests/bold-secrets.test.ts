import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Bold public routes do not serialize server secret keys", () => {
  const hashRoute = readFileSync("src/app/api/bold/hash/route.ts", "utf8");
  const reconcileRoute = readFileSync("src/app/api/bold/reconcile/route.ts", "utf8");
  assert.doesNotMatch(hashRoute, /secretKey|BOLD_SECRET_KEY/);
  assert.doesNotMatch(reconcileRoute, /secretKey|BOLD_SECRET_KEY/);
});
