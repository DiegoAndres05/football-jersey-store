import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const action = readFileSync("src/features/newsletter/server/newsletter-actions.ts", "utf8");
const form = readFileSync("src/features/newsletter/components/newsletter-form.tsx", "utf8");
const schema = readFileSync("prisma/schema.prisma", "utf8");

test("el alta guarda el correo normalizado sin duplicar y reactiva una baja", () => {
  assert.match(action, /newsletterSubscriber\.upsert\(/);
  assert.match(action, /where: \{ email: parsed\.data\.email\.toLowerCase\(\) \}/);
  assert.match(action, /update: \{ unsubscribedAt: null \}/);
  assert.match(action, /create: \{ email: parsed\.data\.email\.toLowerCase\(\) \}/);
});

test("el alta no envía correo y el formulario solo confirma el registro", () => {
  assert.doesNotMatch(action, /resend|fetch\(|NEWSLETTER_FROM|welcome/i);
  assert.match(form, /¡Listo! Tu correo quedó registrado\./);
  assert.doesNotMatch(form, /bienvenida/i);
});

test("el modelo de suscriptor no tiene campos de bienvenida", () => {
  const model = schema.match(/model NewsletterSubscriber \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(model, /unsubscribedAt DateTime\?/);
  assert.doesNotMatch(model, /welcomeStatus|welcomeClaimedAt/);
});
