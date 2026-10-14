import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getEmailConfig } from "../src/features/notifications/config/email-config.ts";
import { getNewsletterConfig, isNewsletterFrom } from "../src/features/newsletter/config/newsletter-from.ts";

const purchaseFrom = "Flashsport <pedidos@example.test>";
const newsletterFrom = "Flashsport <novedades@example.test>";
const apiKey = "test-resend-key";

test("la campaña usa NEWSLETTER_FROM y la compra sigue con EMAIL_FROM", () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousPurchase = process.env.EMAIL_FROM;
  const previousNewsletter = process.env.NEWSLETTER_FROM;
  process.env.RESEND_API_KEY = apiKey;
  process.env.EMAIL_FROM = purchaseFrom;
  process.env.NEWSLETTER_FROM = newsletterFrom;
  try {
    const purchase = getEmailConfig();
    const marketing = getNewsletterConfig();
    assert.ok(purchase);
    assert.equal(purchase.from, purchaseFrom);
    assert.equal(purchase.apiKey, apiKey);
    assert.equal(marketing.ok, true);
    if (marketing.ok) {
      assert.equal(marketing.from, newsletterFrom);
      assert.equal(marketing.apiKey, apiKey);
      assert.notEqual(marketing.from, purchase.from);
    }
  } finally {
    restore("RESEND_API_KEY", previousKey);
    restore("EMAIL_FROM", previousPurchase);
    restore("NEWSLETTER_FROM", previousNewsletter);
  }
});

test("sin NEWSLETTER_FROM no hay envío aunque EMAIL_FROM exista", () => {
  const marketing = getNewsletterConfig({ apiKey, from: undefined });
  assert.equal(marketing.ok, false);
  if (!marketing.ok) assert.match(marketing.error, /NEWSLETTER_FROM/);

  const quotedEmpty = getNewsletterConfig({ apiKey, from: "   " });
  assert.equal(quotedEmpty.ok, false);
});

test("sin clave de Resend no hay envío aunque el remitente sea válido", () => {
  const marketing = getNewsletterConfig({ apiKey: "  ", from: newsletterFrom });
  assert.equal(marketing.ok, false);
  if (!marketing.ok) assert.equal(marketing.error.includes(apiKey), false);
});

test("un remitente inválido bloquea la campaña sin usar el de compra", () => {
  for (const from of ["Flashsport", "novedades", "Nombre <no-es-correo>", "a@b", "uno@example.test\nDos <dos@example.test>"]) {
    assert.equal(isNewsletterFrom(from), false, from);
    const marketing = getNewsletterConfig({ apiKey, from });
    assert.equal(marketing.ok, false);
    if (!marketing.ok) {
      assert.match(marketing.error, /no es válido/);
      assert.equal(marketing.error.includes(purchaseFrom), false);
    }
  }
  assert.equal(isNewsletterFrom(newsletterFrom), true);
  assert.equal(isNewsletterFrom("novedades@example.test"), true);
});

test("la compra no cambia si solo existe el remitente del newsletter", () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousPurchase = process.env.EMAIL_FROM;
  const previousNewsletter = process.env.NEWSLETTER_FROM;
  process.env.RESEND_API_KEY = apiKey;
  delete process.env.EMAIL_FROM;
  process.env.NEWSLETTER_FROM = newsletterFrom;
  try {
    assert.equal(getEmailConfig(), null);
    const marketing = getNewsletterConfig();
    assert.equal(marketing.ok, true);
    if (marketing.ok) assert.equal(marketing.from, newsletterFrom);
  } finally {
    restore("RESEND_API_KEY", previousKey);
    restore("EMAIL_FROM", previousPurchase);
    restore("NEWSLETTER_FROM", previousNewsletter);
  }
});

test("la campaña no llama a Resend si el remitente no está listo", () => {
  const campaign = readFileSync("src/features/newsletter/server/campaign-actions.ts", "utf8");
  const purchaseTransport = readFileSync("src/features/notifications/email/resend-adapter.ts", "utf8");
  const purchaseTemplate = readFileSync("src/features/notifications/email/paid-order-email.ts", "utf8");
  const payment = readFileSync("src/features/orders/services/apply-bold-payment.ts", "utf8");
  const example = readFileSync(".env.example", "utf8");

  const gate = campaign.indexOf("if (!newsletter.ok) return");
  const request = campaign.indexOf("https://api.resend.com/emails/batch");
  assert.ok(gate > 0 && request > gate);
  assert.match(campaign, /getNewsletterConfig\(\)/);
  assert.doesNotMatch(campaign, /getEmailConfig|EMAIL_FROM/);
  assert.match(purchaseTransport, /getEmailConfig\(\)/);
  assert.match(purchaseTransport, /from: config\.from/);
  assert.doesNotMatch(purchaseTransport, /NEWSLETTER_FROM|getNewsletterConfig/);
  assert.doesNotMatch(purchaseTemplate, /NEWSLETTER_FROM|getNewsletterConfig/);
  assert.doesNotMatch(payment, /NEWSLETTER_FROM|getNewsletterConfig/);
  assert.match(example, /NEWSLETTER_FROM="Flashsport <novedades@flashsports\.shop>"/);
  assert.match(example, /EMAIL_FROM=/);
});

function restore(name: "RESEND_API_KEY" | "EMAIL_FROM" | "NEWSLETTER_FROM", value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
