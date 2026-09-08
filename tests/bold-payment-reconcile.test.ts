import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseReturnTxHint,
  resolveReturnPersistence,
} from "@/features/payments/domain/bold-payment-outcome";

describe("017 return fallback contracts", () => {
  it("approved hint + inconclusive API → APPLY_APPROVED", () => {
    assert.equal(resolveReturnPersistence("PENDING", "APPROVED"), "APPLY_APPROVED");
    assert.equal(resolveReturnPersistence("UNAVAILABLE", "APPROVED"), "APPLY_APPROVED");
  });

  it("rejected hint alone does not APPLY_REJECTED when API inconclusive", () => {
    assert.equal(resolveReturnPersistence("PENDING", "REJECTED"), "NOOP");
    assert.equal(resolveReturnPersistence("UNAVAILABLE", parseReturnTxHint("failed")), "NOOP");
  });

  it("API rejected beats forged approved query", () => {
    assert.equal(resolveReturnPersistence("REJECTED", "APPROVED"), "APPLY_REJECTED");
  });
});

describe("confirmation page 017 copy (source)", () => {
  const page = readFileSync(
    join(process.cwd(), "src/app/pedido/confirmado/[code]/page.tsx"),
    "utf8",
  );

  it("paid title and estado use Pago aprobado", () => {
    assert.match(page, /uiMode === "paid" && "Pago aprobado"/);
    assert.doesNotMatch(page, /¡Pago confirmado!/);
    assert.doesNotMatch(page, /uiMode === "paid" && "Pago confirmado"/);
  });

  it("passes returnTxStatus to reconcileBoldOrder", () => {
    assert.match(page, /returnTxStatus:\s*boldTxStatus/);
  });
});

describe("reconcile + apply source return (source)", () => {
  const reconcile = readFileSync(
    join(process.cwd(), "src/features/payments/services/bold-payment-reconcile.ts"),
    "utf8",
  );
  const apply = readFileSync(
    join(process.cwd(), "src/features/orders/services/apply-bold-payment.ts"),
    "utf8",
  );
  const webhook = readFileSync(
    join(process.cwd(), "src/app/api/webhooks/bold/route.ts"),
    "utf8",
  );

  it("reconcile uses resolveReturnPersistence and source return", () => {
    assert.match(reconcile, /resolveReturnPersistence/);
    assert.match(reconcile, /"return"/);
    assert.match(reconcile, /returnTxStatus/);
  });

  it("applyBoldPayment accepts source return", () => {
    assert.match(apply, /"return"/);
  });

  it("webhook still uses applyBoldPayment with source webhook", () => {
    assert.match(webhook, /applyBoldPayment/);
    assert.match(webhook, /source:\s*"webhook"/);
  });
});
