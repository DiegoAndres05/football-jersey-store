import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getPaymentConfig, canOpenBold } from "../src/shared/config/payment.ts";
import { canonicalizeBoldSale } from "../src/features/payments/domain/bold-checkout-attrs.ts";
import { readFileSync } from "node:fs";

describe("Bold sandbox preparation contract", () => {
  test("requires explicit bold-sandbox and accepts only integer COP Colombia charges", () => {
    const config = getPaymentConfig({
      NODE_ENV: "test",
      PAYMENT_PROVIDER: "bold-sandbox",
      BOLD_IDENTITY_KEY: "public-test-key",
      BOLD_SECRET_KEY: "server-test-secret",
    } as NodeJS.ProcessEnv);
    assert.equal(config.provider, "bold-sandbox");
    assert.equal(config.ready, true);
    assert.equal(canOpenBold(config, { country: "CO", currency: "COP", total: 15000 }), true);
    assert.equal(canOpenBold(config, { country: "US", currency: "COP", total: 15000 }), false);
    assert.equal(canOpenBold(config, { country: "CO", currency: "USD", total: 15000 }), false);
    assert.equal(canOpenBold(config, { country: "CO", currency: "COP", total: 0 }), false);
  });

  test("canonicalizes a unique-safe reference and whole COP amount", () => {
    assert.deepEqual(
      canonicalizeBoldSale({ orderId: "FS-2026-09-ABC123", amount: 19999.9, currency: "cop" }),
      { orderId: "FS-2026-09-ABC123", amount: "20000", currency: "COP" },
    );
  });

  test("hash route does not accept client amount or currency as authority", () => {
    const source = readFileSync("src/app/api/bold/hash/route.ts", "utf8");
    assert.match(source, /prepareBoldTransaction/);
    assert.doesNotMatch(source, /prepareBoldPayment\(\{\s*orderId,\s*amount,\s*currency/);
  });
});
