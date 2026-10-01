import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { computeBoldIntegritySignature } from "../src/features/payments/domain/bold-integrity";
import {
  preparedTransactionCurrencyProblems,
  type PreparedCurrencyEvidenceInput,
} from "../src/features/payments/domain/bold-currency-evidence";

const SECRET = "test-secret-key";
const ORDER = "FS-2026-09-UTDRQM";

function validInput(overrides: Partial<PreparedCurrencyEvidenceInput> = {}): PreparedCurrencyEvidenceInput {
  return {
    orderCode: ORDER,
    orderCurrency: "COP",
    boldStatus: "APPROVED",
    boldReference: ORDER,
    boldAmount: 115000,
    transaction: {
      externalReference: ORDER,
      amount: 115000,
      currency: "COP",
      signatureHash: computeBoldIntegritySignature(ORDER, 115000, "COP", SECRET),
    },
    secretKey: SECRET,
    ...overrides,
  };
}

test("a signed prepared transaction that matches everything verifies the currency", () => {
  assert.deepEqual(preparedTransactionCurrencyProblems(validInput()), []);
});

test("missing prepared transaction keeps the order pending", () => {
  assert.deepEqual(preparedTransactionCurrencyProblems(validInput({ transaction: null })), ["no prepared BoldTransaction"]);
});

test("each broken condition is reported", () => {
  const base = validInput();
  const cases: Array<[Partial<PreparedCurrencyEvidenceInput>, RegExp]> = [
    [{ boldStatus: "PENDING" }, /not APPROVED/],
    [{ boldStatus: null }, /not APPROVED/],
    [{ boldReference: "FS-OTHER" }, /reference_id/],
    [{ boldReference: undefined }, /reference_id/],
    [{ boldAmount: 114999 }, /amount/],
    [{ boldAmount: undefined }, /amount/],
    [{ transaction: { ...base.transaction!, externalReference: "FS-OTHER" } }, /externalReference/],
    [{ transaction: { ...base.transaction!, currency: "USD" } }, /prepared currency/],
    [{ orderCurrency: "USD" }, /prepared currency/],
    [{ transaction: { ...base.transaction!, signatureHash: null } }, /no integrity signature/],
    [{ transaction: { ...base.transaction!, signatureHash: "0".repeat(64) } }, /integrity signature does not match/],
    [{ secretKey: "" }, /cannot be recomputed/],
    [{ secretKey: "other-secret" }, /integrity signature does not match/],
  ];
  for (const [override, reason] of cases) {
    const problems = preparedTransactionCurrencyProblems(validInput(override));
    assert.ok(problems.some((problem) => reason.test(problem)), `${JSON.stringify(override)} → ${problems.join(" | ")}`);
  }
});

test("a tampered prepared amount breaks the integrity signature", () => {
  const base = validInput();
  const problems = preparedTransactionCurrencyProblems(validInput({
    boldAmount: 1000,
    transaction: { ...base.transaction!, amount: 1000 },
  }));
  assert.ok(problems.some((problem) => /integrity signature does not match/.test(problem)));
});

test("empty or missing prepared currency is never treated as COP", () => {
  const base = validInput();
  for (const currency of ["", "   "]) {
    const problems = preparedTransactionCurrencyProblems(validInput({ transaction: { ...base.transaction!, currency } }));
    assert.ok(problems.some((problem) => /prepared currency/.test(problem)), `currency "${currency}"`);
  }
});

test("reconcile never defaults a missing Bold currency to COP", () => {
  const reconcile = readFileSync("src/features/payments/services/bold-payment-reconcile.ts", "utf8");
  assert.doesNotMatch(reconcile, /BOLD_BUTTON_CURRENCY/);
  assert.doesNotMatch(reconcile, /currency[^\n]*(\|\||\?\?)\s*"COP"/);
  assert.match(reconcile, /if \(boldCurrency\) \{/);
  assert.match(reconcile, /boldCurrency !== expectedCurrency/);
  assert.match(reconcile, /preparedTransactionCurrencyProblems\(/);
  assert.match(reconcile, /currencySource=signed-transaction/);
});
