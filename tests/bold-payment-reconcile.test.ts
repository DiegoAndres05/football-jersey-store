import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseReturnTxHint,
  resolveReturnPersistence,
} from "@/features/payments/domain/bold-payment-outcome";

describe("017 return fallback contracts", () => {
  it("API APPROVED → APPLY_APPROVED (Bold API is sole authority)", () => {
    assert.equal(resolveReturnPersistence("APPROVED", null), "APPLY_APPROVED");
  });

  it("API REJECTED + hint APPROVED → APPLY_REJECTED (Bold API wins)", () => {
    assert.equal(resolveReturnPersistence("REJECTED", "APPROVED"), "APPLY_REJECTED");
  });

  it("API PENDING/UNAVAILABLE + hint APPROVED → NOOP (returnHint is IGNORED)", () => {
    assert.equal(resolveReturnPersistence("PENDING", "APPROVED"), "NOOP");
    assert.equal(resolveReturnPersistence("UNAVAILABLE", "APPROVED"), "NOOP");
  });
});

describe("reconcile source contracts (source-level assertions)", () => {
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
  const page = readFileSync(
    join(process.cwd(), "src/app/pedido/confirmado/[code]/page.tsx"),
    "utf8",
  );

  it("reconcile uses resolveReturnPersistence and source return", () => {
    assert.match(reconcile, /resolveReturnPersistence/);
    assert.match(reconcile, /"return"/);
    assert.match(reconcile, /returnTxStatus/);
  });

  it("reconcile logs decisions", () => {
    assert.match(reconcile, /console\.log/);
    assert.match(reconcile, /apiOutcome/);
  });

  it("reconcile validates amount + currency + reference_id on APPROVED", () => {
    assert.match(reconcile, /amount mismatch/);
    assert.match(reconcile, /currency mismatch/);
    assert.match(reconcile, /reference_id mismatch/);
    assert.match(reconcile, /orderTotal/);
    assert.match(reconcile, /orderCurrency/);
  });

  it("reconcile returns PENDING on integrity validation failure", () => {
    assert.match(reconcile, /validationErrors\.length > 0[\s\S]*?return \{ outcome: "PENDING" \}/);
  });

  it("applyBoldPayment accepts source return", () => {
    assert.match(apply, /"return"/);
  });

  it("webhook still uses applyBoldPayment with source webhook", () => {
    assert.match(webhook, /applyBoldPayment/);
    assert.match(webhook, /source:\s*"webhook"/);
  });

  it("confirmation page does NOT perform server-side reconcile", () => {
    assert.doesNotMatch(page, /reconcileBoldOrder/);
    assert.doesNotMatch(page, /reconcileBoldOrder\(/);
  });

  it("confirmation page passes boldOrderId to client component", () => {
    assert.match(page, /boldOrderId=\{boldOrderId\}/);
  });
});

describe("bold-service API URL correctness (source-level)", () => {
  const service = readFileSync(
    join(process.cwd(), "src/features/payments/services/bold-service.ts"),
    "utf8",
  );

  it("uses correct Bold API base URL", () => {
    assert.match(service, /https:\/\/payments\.api\.bold\.co/);
    assert.doesNotMatch(service, /api\.online\.payments\.bold\.co/);
  });

  it("uses v2 payment-voucher endpoint", () => {
    assert.match(service, /\/v2\/payment-voucher\//);
    assert.doesNotMatch(service, /\/v1\/payment\//);
  });

  it("parses payment_status from top-level response", () => {
    assert.match(service, /data\.payment_status/);
  });

  it("moves getBoldConfig inside try/catch for getBoldTransactionStatus", () => {
    // The function should have try/catch around getBoldConfig
    const fnMatch = service.match(
      /export async function getBoldTransactionStatus[\s\S]*?(?=export |$)/,
    );
    assert.ok(fnMatch, "getBoldTransactionStatus function found");
    const fn = fnMatch[0];
    // getBoldConfig should be called inside a try block
    assert.match(fn, /try\s*\{[\s\S]*getBoldConfig\(\)/);
  });

  it("logs API query and result", () => {
    assert.match(service, /\[Bold API\] Querying transaction status/);
    assert.match(service, /\[Bold API\] Transaction/);
  });

  it("parses currency from Bold API response", () => {
    assert.match(service, /currency\?:\s*string/, "return type includes currency");
    assert.match(service, /data\.currency/, "parses currency from response");
  });
});

describe("reconcile API route correctness (source-level)", () => {
  let route: string;
  try {
    route = readFileSync(
      join(process.cwd(), "src/app/api/bold/reconcile/route.ts"),
      "utf8",
    );
  } catch {
    route = "";
  }

  it("reconcile route file exists", () => {
    assert.ok(route, "reconcile route.ts should exist");
  });

  it("does not accept bold-tx-status from client", () => {
    assert.doesNotMatch(route, /bold-tx-status/);
  });

  it("validates order exists before reconcile", () => {
    assert.match(route, /getOrderByCode/);
    assert.match(route, /Order not found/);
  });

  it("checks order is not already finalized", () => {
    assert.match(route, /already PAID/);
    assert.match(route, /already PAYMENT_FAILED/);
  });

  it("rejects unexpected order status with 409", () => {
    assert.match(route, /unexpected status/);
    assert.match(route, /409/);
  });

  it("calls reconcileBoldOrder without returnTxStatus (no client-provided payment status)", () => {
    // The route must not pass returnTxStatus to reconcileBoldOrder
    // (there's a comment mentioning it, but the actual call should not include it)
    const lines = route.split("\n");
    const callStart = lines.findIndex((l) => l.includes("reconcileBoldOrder({"));
    assert.ok(callStart >= 0, "reconcileBoldOrder call found");
    // Collect lines from call start until closing })
    const callLines: string[] = [];
    for (let i = callStart; i < lines.length && i < callStart + 15; i++) {
      callLines.push(lines[i]);
      if (lines[i].includes("});")) break;
    }
    const callText = callLines.join("\n");
    assert.doesNotMatch(callText, /returnTxStatus\s*:/);
    assert.match(callText, /orderTotal/, "must pass orderTotal from DB");
    assert.match(callText, /orderCurrency/, "must pass orderCurrency from DB");
  });

  it("returns PENDING for inconclusive Bold responses", () => {
    assert.match(route, /status:\s*"PENDING"/);
  });

  it("returns proper status codes", () => {
    assert.match(route, /400/);
    assert.match(route, /404/);
    assert.match(route, /500/);
  });
});

describe("ConfirmationPaymentStatus client component (source-level)", () => {
  let component: string;
  try {
    component = readFileSync(
      join(process.cwd(), "src/app/pedido/confirmado/[code]/confirmation-payment-status.tsx"),
      "utf8",
    );
  } catch {
    component = "";
  }

  it("calls POST /api/bold/reconcile", () => {
    assert.match(component, /\/api\/bold\/reconcile/);
    assert.match(component, /method:\s*"POST"/);
  });

  it("does not send bold-tx-status to server (only in JSDoc comment)", () => {
    // bold-tx-status should NOT appear in the fetch body, only in the security JSDoc comment
    const lines = component.split("\n");
    const bodyStart = lines.findIndex((l) => l.includes("body: JSON.stringify("));
    assert.ok(bodyStart >= 0, "fetch body found");
    const bodyLines: string[] = [];
    for (let i = bodyStart; i < lines.length && i < bodyStart + 5; i++) {
      bodyLines.push(lines[i]);
      if (lines[i].includes("}),")) break;
    }
    const bodyText = bodyLines.join("\n");
    assert.doesNotMatch(bodyText, /bold-tx-status/);
  });

  it("sends only orderCode and boldOrderId", () => {
    assert.match(component, /orderCode/);
    assert.match(component, /boldOrderId/);
  });

  it("has bounded retry (MAX_ATTEMPTS)", () => {
    assert.match(component, /MAX_ATTEMPTS/);
  });

  it("has manual retry button", () => {
    assert.match(component, /Verificar de nuevo/);
    assert.match(component, /RotateCcw/);
  });

  it("handles PAID response", () => {
    assert.match(component, /status === "PAID"/);
    assert.match(component, /setMode\("paid"\)/);
  });

  it("handles REJECTED response", () => {
    assert.match(component, /status === "REJECTED"/);
    assert.match(component, /setMode\("failed"\)/);
  });

  it("clears timer on unmount", () => {
    assert.match(component, /clearTimeout/);
  });
});

/**
 * Integration-level test contracts for the reconcile endpoint:
 *
 * These require Prisma + Bold API and are validated via manual testing.
 *
 * 1. APPROVED response finalizes payment
 *    - Create order with status PENDING_PAYMENT
 *    - Mock Bold API to return payment_status: APPROVED
 *    - POST /api/bold/reconcile → should return { status: "PAID" }
 *    - Order in DB should be PAID with paidAt set
 *
 * 2. PENDING response does not finalize payment
 *    - Mock Bold API to return payment_status: PENDING
 *    - POST /api/bold/reconcile → should return { status: "PENDING" }
 *    - Order should remain PENDING_PAYMENT
 *
 * 3. REJECTED response marks payment failed
 *    - Mock Bold API to return payment_status: REJECTED
 *    - POST /api/bold/reconcile → should return { status: "REJECTED" }
 *    - Order should be PAYMENT_FAILED
 *
 * 4. Network/API error remains pending
 *    - Mock Bold API to throw or return non-200
 *    - POST /api/bold/reconcile → should return { status: "PENDING" }
 *    - Order should remain PENDING_PAYMENT
 *
 * 5. Webhook-first followed by reconcile is idempotent
 *    - Webhook marks order as PAID
 *    - POST /api/bold/reconcile → should return { status: "PAID" }
 *    - Order should be PAID (no duplicate history)
 *
 * 6. Reconcile-first followed by webhook is idempotent
 *    - POST /api/bold/reconcile marks order as PAID
 *    - Webhook arrives → applyBoldPayment returns NOT_PENDING
 *    - Order should be PAID (no duplicate history)
 *
 * 7. Duplicate reconcile calls do not duplicate inventory or history
 *    - POST /api/bold/reconcile twice
 *    - Second call should return PAID without additional history entries
 *    - Inventory movements should remain unchanged
 *
 * 8. Invalid/mismatched Bold reference cannot finalize another order
 *    - Order A has reference FS-2026-09-AAAAAA
 *    - POST /api/bold/reconcile with orderCode FS-2026-09-BBBBBB
 *    - Should return 404 (order not found)
 *    - Order A should remain unchanged
 */
