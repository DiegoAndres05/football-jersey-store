import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { campaignProblems, renderCampaignEmail, subscribedEmails } from "../src/features/newsletter/domain/campaign-message.ts";
import { createUnsubscribeToken, readUnsubscribeToken } from "../src/features/newsletter/domain/unsubscribe-token.ts";

test("la baja firmada recupera el mismo correo", () => {
  const previous = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = "test-secret";
  try {
    const token = createUnsubscribeToken("Ana@Example.test");
    assert.ok(token);
    assert.equal(readUnsubscribeToken(token!), "ana@example.test");
    assert.equal(readUnsubscribeToken(`${token}x`), null);
  } finally {
    if (previous === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = previous;
  }
});

test("la campaña exige asunto y mensaje, y omite dados de baja", () => {
  assert.equal(campaignProblems({ subject: "Oferta de octubre", body: "Descuento en camisetas locales." }), null);
  assert.match(campaignProblems({ subject: "No", body: "corto" }) ?? "", /asunto|mensaje/);
  const active = subscribedEmails([
    { email: "a@example.test", unsubscribedAt: null },
    { email: "b@example.test", unsubscribedAt: new Date() },
  ]);
  assert.deepEqual(active, ["a@example.test"]);
});

test("cada correo de oferta incluye el enlace de baja y escapa HTML", () => {
  const rendered = renderCampaignEmail({
    body: "Hola <script>",
    unsubscribeHref: "https://www.flashsports.shop/newsletter/baja?token=abc",
  });
  assert.match(rendered.text, /newsletter\/baja\?token=abc/);
  assert.match(rendered.html, /Dejar de recibir ofertas/);
  assert.equal(rendered.html.includes("<script>"), false);
});

test("el admin lista suscriptores y el envío no vive en el cliente", () => {
  const page = readFileSync("src/app/admin/(dashboard)/newsletter/page.tsx", "utf8");
  const form = readFileSync("src/app/admin/(dashboard)/newsletter/campaign-form.tsx", "utf8");
  const layout = readFileSync("src/app/admin/(dashboard)/layout.tsx", "utf8");
  assert.match(page, /unsubscribedAt/);
  assert.match(layout, /\/admin\/newsletter/);
  assert.doesNotMatch(form, /RESEND_API_KEY|NEXTAUTH_SECRET/);
});
