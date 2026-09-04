import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveVisibleCurrency } from "../src/shared/currency/sale-currency.ts";
import { formatMoney } from "../src/shared/money/format.ts";

describe("resolveVisibleCurrency", () => {
  it("coerción USD → COP si no hay tasa", () => {
    const ctx = resolveVisibleCurrency("USD", { available: false });
    assert.equal(ctx.currency, "COP");
    assert.equal(ctx.copPerUsd, null);
  });

  it("coerción USD → COP si la tasa es inválida", () => {
    const ctx = resolveVisibleCurrency("USD", { available: true, copPerUsd: 0 });
    assert.equal(ctx.currency, "COP");
  });

  it("USD solo con tasa vigente", () => {
    const ctx = resolveVisibleCurrency("USD", { available: true, copPerUsd: 4000 });
    assert.equal(ctx.currency, "USD");
    assert.equal(ctx.copPerUsd, 4000);
  });
});

describe("formatMoney coherencia COP/USD", () => {
  it("USD con tasa no se parece a $89.900 COP", () => {
    const cop = formatMoney({ amountCop: 89900, currency: "COP" });
    const usd = formatMoney({ amountCop: 89900, currency: "USD", copPerUsd: 4000 });
    assert.match(cop, /89\.900|89900/);
    assert.match(usd, /USD/);
    assert.doesNotMatch(usd, /89\.900/);
    assert.doesNotMatch(usd, /COP/);
    assert.notEqual(usd, cop);
  });

  it("USD sin tasa no se pinta como COP", () => {
    const cop = formatMoney({ amountCop: 89900, currency: "COP" });
    const usd = formatMoney({ amountCop: 89900, currency: "USD" });
    assert.match(usd, /USD/);
    assert.doesNotMatch(usd, /COP/);
    assert.doesNotMatch(usd, /89\.900/);
    assert.notEqual(usd, cop);
  });
});
