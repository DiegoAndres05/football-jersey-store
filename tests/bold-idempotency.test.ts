import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { computeBoldIntegritySignature } from "../src/features/payments/domain/bold-integrity.ts";
import { normalizeBoldClientStatus } from "../src/app/checkout/bold-client.tsx";
import { readFileSync } from "node:fs";

describe("Bold integrity and idempotency contracts", () => {
  test("signature is deterministic and status never trusts unknown values", () => {
    const expected = createHash("sha256").update("FS-1"+"10000"+"COP"+"secret").digest("hex");
    assert.equal(computeBoldIntegritySignature("FS-1", 10000, "COP", "secret"), expected);
    assert.equal(normalizeBoldClientStatus("approved"), "APPROVED");
    assert.equal(normalizeBoldClientStatus("cancelled"), "CANCELLED");
    assert.equal(normalizeBoldClientStatus("tampered"), "UNKNOWN");
  });

  test("reconcile and webhook retain server-side verification and idempotent apply", () => {
    const reconcile = readFileSync("src/app/api/bold/reconcile/route.ts", "utf8");
    const webhook = readFileSync("src/app/api/webhooks/bold/route.ts", "utf8");
    assert.match(reconcile, /orderTotal/);
    assert.match(reconcile, /orderCurrency/);
    assert.match(webhook, /verifyBoldWebhookSignature/);
    assert.match(webhook, /source:\s*"webhook"/);
  });
});
