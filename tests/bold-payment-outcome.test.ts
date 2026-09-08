import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeBoldOutcome,
  normalizeWebhookEventType,
  parseReturnTxHint,
  resolveReturnPersistence,
} from "@/features/payments/domain/bold-payment-outcome";

describe("normalizeBoldOutcome", () => {
  it("maps 'approved' (lowercase) → APPROVED", () => {
    assert.equal(normalizeBoldOutcome("approved"), "APPROVED");
  });

  it("maps 'APPROVED' (uppercase) → APPROVED", () => {
    assert.equal(normalizeBoldOutcome("APPROVED"), "APPROVED");
  });

  it("maps 'Approved' (mixed case) → APPROVED", () => {
    assert.equal(normalizeBoldOutcome("Approved"), "APPROVED");
  });

  it("maps 'SaleApproved' → APPROVED", () => {
    assert.equal(normalizeBoldOutcome("SaleApproved"), "APPROVED");
  });

  it("maps 'SALE_APPROVED' → APPROVED", () => {
    assert.equal(normalizeBoldOutcome("SALE_APPROVED"), "APPROVED");
  });

  it("maps 'rejected' → REJECTED", () => {
    assert.equal(normalizeBoldOutcome("rejected"), "REJECTED");
  });

  it("maps 'REJECTED' → REJECTED", () => {
    assert.equal(normalizeBoldOutcome("REJECTED"), "REJECTED");
  });

  it("maps 'failed' → REJECTED", () => {
    assert.equal(normalizeBoldOutcome("failed"), "REJECTED");
  });

  it("maps 'FAILED' → REJECTED", () => {
    assert.equal(normalizeBoldOutcome("FAILED"), "REJECTED");
  });

  it("maps 'declined' → REJECTED", () => {
    assert.equal(normalizeBoldOutcome("declined"), "REJECTED");
  });

  it("maps 'SaleRejected' → REJECTED", () => {
    assert.equal(normalizeBoldOutcome("SaleRejected"), "REJECTED");
  });

  it("maps 'SALE_REJECTED' → REJECTED", () => {
    assert.equal(normalizeBoldOutcome("SALE_REJECTED"), "REJECTED");
  });

  it("maps 'pending' → PENDING", () => {
    assert.equal(normalizeBoldOutcome("pending"), "PENDING");
  });

  it("maps 'PENDING' → PENDING", () => {
    assert.equal(normalizeBoldOutcome("PENDING"), "PENDING");
  });

  it("maps 'NO_TRANSACTION_FOUND' → PENDING", () => {
    assert.equal(normalizeBoldOutcome("NO_TRANSACTION_FOUND"), "PENDING");
  });

  it("maps empty string → PENDING", () => {
    assert.equal(normalizeBoldOutcome(""), "PENDING");
  });

  it("maps null → PENDING", () => {
    assert.equal(normalizeBoldOutcome(null), "PENDING");
  });

  it("maps undefined → PENDING", () => {
    assert.equal(normalizeBoldOutcome(undefined), "PENDING");
  });

  it("maps unknown status → PENDING (safe default)", () => {
    assert.equal(normalizeBoldOutcome("some_unknown_status"), "PENDING");
  });

  it("handles whitespace around status", () => {
    assert.equal(normalizeBoldOutcome("  approved  "), "APPROVED");
  });
});

describe("normalizeWebhookEventType", () => {
  it("maps 'SALE_APPROVED' → APPROVED", () => {
    assert.equal(normalizeWebhookEventType("SALE_APPROVED"), "APPROVED");
  });

  it("maps 'SALE_REJECTED' → REJECTED", () => {
    assert.equal(normalizeWebhookEventType("SALE_REJECTED"), "REJECTED");
  });

  it("returns null for unknown event type", () => {
    assert.equal(normalizeWebhookEventType("OTHER_EVENT"), null);
  });

  it("returns null for null input", () => {
    assert.equal(normalizeWebhookEventType(null), null);
  });

  it("returns null for undefined input", () => {
    assert.equal(normalizeWebhookEventType(undefined), null);
  });
});

describe("resolveReturnPersistence", () => {
  it("API APPROVED → APPLY_APPROVED regardless of hint", () => {
    assert.equal(resolveReturnPersistence("APPROVED", "APPROVED"), "APPLY_APPROVED");
    assert.equal(resolveReturnPersistence("APPROVED", "REJECTED"), "APPLY_APPROVED");
    assert.equal(resolveReturnPersistence("APPROVED", null), "APPLY_APPROVED");
  });

  it("API REJECTED → APPLY_REJECTED even if hint is APPROVED", () => {
    assert.equal(resolveReturnPersistence("REJECTED", "APPROVED"), "APPLY_REJECTED");
    assert.equal(resolveReturnPersistence("REJECTED", null), "APPLY_REJECTED");
  });

  it("API PENDING/UNAVAILABLE → NOOP (returnHint is IGNORED — Bold API is sole authority)", () => {
    assert.equal(resolveReturnPersistence("PENDING", "APPROVED"), "NOOP");
    assert.equal(resolveReturnPersistence("PENDING", "REJECTED"), "NOOP");
    assert.equal(resolveReturnPersistence("PENDING", "PENDING"), "NOOP");
    assert.equal(resolveReturnPersistence("PENDING", null), "NOOP");
    assert.equal(resolveReturnPersistence("UNAVAILABLE", "APPROVED"), "NOOP");
    assert.equal(resolveReturnPersistence("UNAVAILABLE", null), "NOOP");
  });
});

describe("parseReturnTxHint", () => {
  it("maps approved query → APPROVED", () => {
    assert.equal(parseReturnTxHint("approved"), "APPROVED");
  });

  it("maps rejected query → REJECTED", () => {
    assert.equal(parseReturnTxHint("rejected"), "REJECTED");
  });

  it("absent or empty → null", () => {
    assert.equal(parseReturnTxHint(null), null);
    assert.equal(parseReturnTxHint(undefined), null);
    assert.equal(parseReturnTxHint(""), null);
    assert.equal(parseReturnTxHint("   "), null);
  });
});

/**
 * applyBoldPayment / reconcileBoldOrder contracts (integration-level):
 *
 * These require Prisma + Bold API and are validated via:
 * - T007/T010: Manual testing with Bold sandbox (approved/rejected cards)
 * - T018: Quickstart checklist end-to-end
 *
 * Key invariants (tested via quickstart):
 * 1. APPROVED from PENDING_PAYMENT → PAID + paidAt + history + notifyOrderPaid
 * 2. REJECTED from PENDING_PAYMENT → PAYMENT_FAILED + history (no notification)
 * 3. Double apply APPROVED → second call is no-op (idempotent)
 * 4. APPROVED when already PAID → NOT_PENDING (no corruption)
 * 5. REJECTED cannot move PAID → PAYMENT_FAILED
 * 6. Order not found → NOT_FOUND
 * 7. Webhook and reconcile share the same transition (no divergent inline updates)
 */
