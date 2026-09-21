import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutFormSchema } from "../src/features/checkout/schemas/checkout-schema.ts";
import { quoteShipping } from "../src/features/checkout/shipping.ts";
import { validateConsents } from "../src/features/checkout/validation.ts";

test("checkout requires guest contact and address fields", () => {
  const result = checkoutFormSchema.safeParse({
    fullName: "Ana Pérez", email: "ana@example.com", phone: "3001234567",
    shippingFullName: "Ana Pérez", shippingPhone: "3001234567",
    shippingLine1: "Calle 1 # 2-3", shippingCity: "Bogotá", shippingState: "Cundinamarca",
    shippingCountry: "Colombia", consentTerms: true, consentPrivacy: true, consentDataProcessing: true,
  });
  assert.equal(result.success, true);
});

test("shipping is free at the inclusive national threshold", () => {
  assert.equal(quoteShipping("CO", 199999).fee, 15000);
  assert.equal(quoteShipping("Colombia", 200000).fee, 0);
  assert.equal(quoteShipping("CO", 300000).shippingScope, "NATIONAL");
});

test("international checkout is a non-chargeable quote", () => {
  const quote = quoteShipping("Estados Unidos", 100000);
  assert.equal(quote.chargeable, false);
  assert.equal(quote.currency, "COP");
  assert.equal(quote.shippingScope, "INTERNATIONAL_QUOTE_PENDING");
});

test("each missing consent has an actionable document error", () => {
  const errors = validateConsents({});
  assert.deepEqual(errors.map((error) => error.field), ["TERMS", "PRIVACY", "DATA_PROCESSING"]);
});
