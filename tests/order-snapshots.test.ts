import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutFormSchema } from "../src/features/checkout/schemas/checkout-schema.ts";

test("checkout form contract carries independent consent snapshots", () => {
  const parsed = checkoutFormSchema.parse({
    fullName: "Ana Pérez", email: "ana@example.com", phone: "3001234567",
    shippingFullName: "Ana Pérez", shippingPhone: "3001234567",
    shippingLine1: "Calle 1 # 2-3", shippingCity: "Bogotá", shippingState: "Cundinamarca",
    shippingCountry: "CO", consentTerms: true, consentPrivacy: true, consentDataProcessing: true,
  });
  assert.equal(parsed.consentTerms, true);
  assert.equal(parsed.consentPrivacy, true);
  assert.equal(parsed.consentDataProcessing, true);
});
