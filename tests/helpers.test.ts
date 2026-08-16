import { test } from "node:test";
import assert from "node:assert/strict";
import { processMockPayment } from "../src/features/payments/services/mock-payment.ts";
import { whatsappLink, SHIPPING } from "../src/shared/config/site.ts";

test("mock payment: éxito con referencia SIM y datos passthrough", async () => {
  const res = await processMockPayment({ method: "CARD", amount: 104900 });
  assert.equal(res.ok, true);
  assert.ok(res.ok && res.reference.startsWith("SIM-"));
  assert.ok(res.ok && res.paidAt instanceof Date);
  assert.equal(res.ok && res.method, "CARD");
  assert.equal(res.ok && res.amount, 104900);
});

test("mock payment: otro método (PSE) devuelve el método recibido", async () => {
  const res = await processMockPayment({ method: "PSE", amount: 0 });
  assert.equal(res.ok, true);
  assert.equal(res.ok && res.method, "PSE");
});

test("whatsappLink: usa el número de la app y codifica el mensaje", () => {
  const link = whatsappLink("¿Tienes la camiseta de Colombia?");
  assert.equal(link, "https://wa.me/573000000000?text=%C2%BFTienes%20la%20camiseta%20de%20Colombia%3F");
});

test("whatsappLink: número personalizado con formato pasa a dígitos", () => {
  const link = whatsappLink("hola", "+57 (300) 111-2233");
  assert.equal(link, "https://wa.me/573001112233?text=hola");
});

test("constantes de envío coherentes con la función", () => {
  assert.ok(SHIPPING.flatFee > 0);
  assert.ok(SHIPPING.freeThreshold > SHIPPING.flatFee);
});