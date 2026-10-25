import test from "node:test";
import assert from "node:assert/strict";
import {
  BOLD_MODAL_OPEN_TIMEOUT_MS,
  boldEventMarksPaid,
  isBoldCheckoutCloseEvent,
  nextBoldModalPhase,
} from "../src/features/payments/domain/bold-modal-session.ts";

test("cerrar Bold no marca el pedido como pagado", () => {
  const closed = { type: "BOLD_CHECKOUT_EVENT", status: "APPROVED", boldTxStatus: "APPROVED" };
  assert.equal(boldEventMarksPaid(closed), false);
  assert.equal(boldEventMarksPaid({ type: "BOLD_CHECKOUT_EVENT", "bold-tx-status": "approved" }), false);
  assert.equal(isBoldCheckoutCloseEvent("https://checkout.bold.co", closed), true);
  assert.equal(isBoldCheckoutCloseEvent("https://evil.example", closed), false);
  assert.equal(nextBoldModalPhase("processing", "closed"), "retry");
  assert.equal(nextBoldModalPhase("processing", "timeout"), "retry");
  assert.equal(nextBoldModalPhase("preparing", "timeout"), "retry");
  assert.equal(nextBoldModalPhase("retry", "timeout"), "retry");
  assert.equal(nextBoldModalPhase("success", "closed"), "success");
  assert.equal(BOLD_MODAL_OPEN_TIMEOUT_MS, 20_000);
});
