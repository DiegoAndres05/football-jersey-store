import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseShippingFee,
  quoteShipping,
  SHIPPING_FEE_MAX_COP,
} from "../src/features/checkout/shipping.ts";
import { calculateOrderBreakdown } from "../src/features/checkout/domain/order-breakdown.ts";
import { validateShippingRates } from "../src/features/system/schemas/shipping-rates-schema.ts";

const rates = { nationalFeeCop: 9000, internationalFeeCop: 45000 };

test("las tarifas guardadas inválidas vuelven al valor de respaldo", () => {
  assert.equal(parseShippingFee(null, 15000), 15000);
  assert.equal(parseShippingFee("12.5", 15000), 15000);
  assert.equal(parseShippingFee("-1", 15000), 15000);
  assert.equal(parseShippingFee(String(SHIPPING_FEE_MAX_COP + 1), 15000), 15000);
  assert.equal(parseShippingFee("0", 15000), 0);
  assert.equal(parseShippingFee("22000", 15000), 22000);
});

test("el admin acepta precios enteros y rechaza decimales o negativos", () => {
  const ok = new FormData();
  ok.set("nationalFeeCop", "18000");
  ok.set("internationalFeeCop", "0");
  assert.equal(validateShippingRates(ok).success, true);

  const bad = new FormData();
  bad.set("nationalFeeCop", "18.5");
  bad.set("internationalFeeCop", "-1");
  assert.equal(validateShippingRates(bad).success, false);
});

test("la cotización usa el precio nacional e internacional configurado", () => {
  assert.equal(quoteShipping("Colombia", 100000, rates).fee, 9000);
  assert.equal(quoteShipping("Colombia", 200000, rates).fee, 0);
  assert.equal(quoteShipping("Colombia", 100000, rates).chargeable, true);

  const international = quoteShipping("Estados Unidos", 100000, rates);
  assert.equal(international.fee, 45000);
  assert.equal(international.chargeable, false);
  assert.equal(international.shippingScope, "INTERNATIONAL");
});

test("el checkout muestra el mismo precio que se cobra", () => {
  const national = calculateOrderBreakdown({
    productSubtotal: 100000,
    country: "Colombia",
    shippingRates: rates,
  });
  assert.equal(national.shipping, 9000);
  assert.equal(national.total, 109000);

  const abroad = calculateOrderBreakdown({
    productSubtotal: 100000,
    country: "España",
    shippingRates: rates,
  });
  assert.equal(abroad.shipping, 45000);
  assert.equal(abroad.total, 145000);
});
