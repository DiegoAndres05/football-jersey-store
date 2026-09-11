import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveReturnPersistence,
  type ReturnHint,
} from "@/features/payments/domain/bold-payment-outcome";

// ─── FASE 6: Security tests — P0 vulnerability remediation ───
//
// These tests prove that:
// 1. URL manipulation cannot approve a payment
// 2. Bold API is the SOLE authority for payment finalization
// 3. Cross-order protection works
// 4. Amount/currency validation prevents tampered payments
// 5. No client-provided data can influence the outcome

describe("P0 Security: URL manipulation cannot approve payment", () => {
  it("REJECTED + manipulated URL approved → NO PAID", () => {
    // Bold API says REJECTED, attacker sets ?bold-tx-status=approved
    const result = resolveReturnPersistence("REJECTED", "APPROVED");
    assert.equal(result, "APPLY_REJECTED", "REJECTED + URL approved → APPLY_REJECTED (not APPROVED)");
  });

  it("PENDING + URL approved → NO PAID", () => {
    // Bold API says PENDING, attacker sets ?bold-tx-status=approved
    const result = resolveReturnPersistence("PENDING", "APPROVED");
    assert.equal(result, "NOOP", "PENDING + URL approved → NOOP (not APPROVED)");
  });

  it("UNAVAILABLE + URL approved → NO PAID", () => {
    // Bold API says UNAVAILABLE (network error), attacker sets ?bold-tx-status=approved
    const result = resolveReturnPersistence("UNAVAILABLE", "APPROVED");
    assert.equal(result, "NOOP", "UNAVAILABLE + URL approved → NOOP (not APPROVED)");
  });

  it("APPROVED + URL REJECTED → PAID (Bold API wins)", () => {
    // Bold API says APPROVED, attacker tries to reject via URL
    const result = resolveReturnPersistence("APPROVED", "REJECTED");
    assert.equal(result, "APPLY_APPROVED", "APPROVED + URL rejected → APPLY_APPROVED (Bold API is authority)");
  });

  it("APPROVED + URL PENDING → PAID (Bold API wins)", () => {
    const result = resolveReturnPersistence("APPROVED", "PENDING");
    assert.equal(result, "APPLY_APPROVED", "APPROVED + URL pending → APPLY_APPROVED");
  });

  it("APPROVED + null returnHint → PAID (no URL param needed)", () => {
    const result = resolveReturnPersistence("APPROVED", null);
    assert.equal(result, "APPLY_APPROVED", "APPROVED + no hint → APPLY_APPROVED");
  });
});

describe("P0 Security: reconcile endpoint accepts no payment status from client", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/bold/reconcile/route.ts"),
    "utf8",
  );

  it("Zod schema does not accept 'status' field", () => {
    assert.doesNotMatch(route, /status:\s*z\./, "Zod schema should not define a 'status' field");
  });

  it("Zod schema does not accept 'returnTxStatus'", () => {
    // The string 'returnTxStatus' appears in a comment, not in the Zod schema or function params
    const zodMatch = route.match(/ReconcileSchema\s*=\s*z\.object\(\{[^}]+\}\)/);
    assert.ok(zodMatch, "Zod schema found");
    assert.doesNotMatch(zodMatch[0], /returnTxStatus/, "Zod schema does not define returnTxStatus");
  });

  it("Zod schema does not accept 'bold-tx-status'", () => {
    const zodMatch = route.match(/ReconcileSchema\s*=\s*z\.object\(\{[^}]+\}\)/);
    assert.ok(zodMatch, "Zod schema found");
    assert.doesNotMatch(zodMatch[0], /bold-tx-status/, "Zod schema does not define bold-tx-status");
  });

  it("reconcileBoldOrder is called without returnTxStatus", () => {
    const lines = route.split("\n");
    const callStart = lines.findIndex((l) => l.includes("reconcileBoldOrder({"));
    assert.ok(callStart >= 0, "reconcileBoldOrder call found");
    const callLines: string[] = [];
    for (let i = callStart; i < lines.length && i < callStart + 15; i++) {
      callLines.push(lines[i]);
      if (lines[i].includes("});")) break;
    }
    const callText = callLines.join("\n");
    assert.doesNotMatch(callText, /returnTxStatus\s*:/, "must not pass returnTxStatus");
    assert.match(callText, /orderTotal/, "must pass orderTotal");
    assert.match(callText, /orderCurrency/, "must pass orderCurrency");
  });

  it("reconcileBoldOrder passes order amount derived from DB (not from client)", () => {
    assert.match(route, /expectedPaymentAmount/, "orderTotal must be derived from the DB order object");
    assert.match(route, /order\.total/, "expected amount must use persisted order total");
    assert.match(route, /order\.exchangeRateCopPerUsd/, "USD expected amount must use persisted exchange rate");
  });
});

describe("P0 Security: reconcile service validates amount + currency + reference_id", () => {
  const reconcile = readFileSync(
    join(process.cwd(), "src/features/payments/services/bold-payment-reconcile.ts"),
    "utf8",
  );

  it("validates Bold reference_id matches orderCode (cross-order protection)", () => {
    assert.match(reconcile, /secondaryRef.*orderCode/, "must verify secondary lookup reference_id matches orderCode");
    assert.match(reconcile, /cross-order attempt/, "must log cross-order attempt");
  });

  it("validates Bold amount matches orderTotal", () => {
    assert.match(reconcile, /amount mismatch/, "must detect amount mismatch");
  });

  it("validates Bold currency matches orderCurrency", () => {
    assert.match(reconcile, /currency mismatch/, "must detect currency mismatch");
  });

  it("rejects with PENDING on integrity validation failure (no apply)", () => {
    // The code should return { outcome: "PENDING" } on validation failure, not call applyBoldPayment
    assert.match(reconcile, /validationErrors\.length > 0[\s\S]*?return \{ outcome: "PENDING" \}/, "must return PENDING on validation failure");
  });

  it("logs integrity validation failures with details", () => {
    assert.match(reconcile, /integrity validation failed/, "must log integrity failure");
  });

  it("accepts orderTotal and orderCurrency in input type", () => {
    assert.match(reconcile, /orderTotal\?:\s*number/, "must accept orderTotal param");
    assert.match(reconcile, /orderCurrency\?:\s*string/, "must accept orderCurrency param");
  });
});

describe("P0 Security: bold-service returns currency from Bold API", () => {
  const service = readFileSync(
    join(process.cwd(), "src/features/payments/services/bold-service.ts"),
    "utf8",
  );

  it("return type includes currency field", () => {
    assert.match(service, /currency\?:\s*string/, "getBoldTransactionStatus must return currency");
  });

  it("parses currency from API response", () => {
    assert.match(service, /data\.currency/, "must parse currency from Bold API response");
  });
});

describe("P0 Security: confirmation page never trusts URL for payment status", () => {
  const page = readFileSync(
    join(process.cwd(), "src/app/pedido/confirmado/[code]/page.tsx"),
    "utf8",
  );
  const component = readFileSync(
    join(process.cwd(), "src/app/pedido/confirmado/[code]/confirmation-payment-status.tsx"),
    "utf8",
  );

  it("page.tsx does not call reconcileBoldOrder", () => {
    assert.doesNotMatch(page, /reconcileBoldOrder\(/, "page must not perform server-side reconcile");
  });

  it("page.tsx does not pass bold-tx-status as returnTxStatus", () => {
    assert.doesNotMatch(page, /returnTxStatus/, "page must not pass returnTxStatus to any function");
  });

  it("client component only sends orderCode + boldOrderId (no status)", () => {
    const bodyMatch = component.match(/body:\s*JSON\.stringify\(([^)]+)\)/);
    assert.ok(bodyMatch, "fetch body found");
    assert.match(bodyMatch![1], /orderCode/, "sends orderCode");
    assert.match(bodyMatch![1], /boldOrderId/, "sends boldOrderId");
    assert.doesNotMatch(bodyMatch![1], /bold-tx-status/, "does NOT send bold-tx-status");
    assert.doesNotMatch(bodyMatch![1], /status/, "does NOT send status");
  });

  it("page reads bold-tx-status only as boolean for UI mode", () => {
    // The page should check typeof === "string" for presence, not use the value
    assert.match(
      page,
      /typeof sp\["bold-tx-status"\] === "string"/,
      "bold-tx-status is checked for presence only (boolean), not used as value",
    );
  });
});

describe("P0 Security: reconcile validates charged currency amount", () => {
  it("converts USD orders before comparing the Bold amount", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/bold/reconcile/route.ts"),
      "utf8",
    );
    assert.match(source, /toUsdCents/);
    assert.match(source, /expectedPaymentAmount/);
    assert.match(source, /orderTotal: expectedPaymentAmount/);
  });
});

describe("P0 Security: applyBoldPayment idempotency (transaction-level re-check)", () => {
  const apply = readFileSync(
    join(process.cwd(), "src/features/orders/services/apply-bold-payment.ts"),
    "utf8",
  );

  it("re-checks order status inside $transaction", () => {
    assert.match(apply, /\$transaction/, "must use Prisma transaction");
    assert.match(apply, /current\.status !== "PENDING_PAYMENT"/, "must re-check status inside transaction");
  });

  it("returns NOT_FOUND for missing order", () => {
    assert.match(apply, /NOT_FOUND/, "must handle missing order");
  });

  it("returns NOT_PENDING for already-finalized order", () => {
    assert.match(apply, /NOT_PENDING/, "must handle already-finalized order");
  });

  it("catches transaction errors gracefully", () => {
    assert.match(apply, /catch/, "must catch transaction errors");
  });
});

describe("P0 Security: Bold API is SOLE authority — no fallback paths to APPROVED", () => {
  it("resolveReturnPersistence has no fallback that produces APPLY_APPROVED from UNAVAILABLE", () => {
    // Verify the function only returns APPLY_APPROVED when apiOutcome is APPROVED
    const outcomes: Array<{ api: string; hint: ReturnHint; expected: string }> = [
      { api: "APPROVED", hint: null, expected: "APPLY_APPROVED" },
      { api: "APPROVED", hint: "APPROVED", expected: "APPLY_APPROVED" },
      { api: "APPROVED", hint: "REJECTED", expected: "APPLY_APPROVED" },
      { api: "APPROVED", hint: "PENDING", expected: "APPLY_APPROVED" },
      { api: "REJECTED", hint: "APPROVED", expected: "APPLY_REJECTED" },
      { api: "REJECTED", hint: null, expected: "APPLY_REJECTED" },
      { api: "PENDING", hint: "APPROVED", expected: "NOOP" },
      { api: "PENDING", hint: null, expected: "NOOP" },
      { api: "PENDING", hint: "REJECTED", expected: "NOOP" },
      { api: "UNAVAILABLE", hint: "APPROVED", expected: "NOOP" },
      { api: "UNAVAILABLE", hint: null, expected: "NOOP" },
      { api: "UNAVAILABLE", hint: "PENDING", expected: "NOOP" },
    ];

    for (const { api, hint, expected } of outcomes) {
      const result = resolveReturnPersistence(api as any, hint);
      assert.equal(
        result,
        expected,
        `resolveReturnPersistence("${api}", ${hint ? `"${hint}"` : "null"}) = "${result}" but expected "${expected}"`,
      );
    }
  });
});
