import { test } from "node:test";
import assert from "node:assert/strict";
import { shippingFee, SHIPPING } from "../src/shared/config/site.ts";
import { checkoutFormSchema } from "../src/features/checkout/schemas/checkout-schema.ts";
import { parseProductFiltersParams } from "../src/features/products/schemas/product-filters-schema.ts";

const VALID_FORM = {
  fullName: "Juan Pérez",
  email: "juan@example.com",
  phone: "3001112233",
  shippingFullName: "Juan Pérez",
  shippingPhone: "3001112233",
  shippingLine1: "Calle 123 # 45-67",
  shippingCity: "Bogotá",
  shippingState: "Cundinamarca",
  shippingZipCode: "110111",
  notes: "",
};

test("shippingFee: gratis en el umbral y gratis por encima", () => {
  assert.equal(shippingFee(SHIPPING.freeThreshold), 0);
  assert.equal(shippingFee(SHIPPING.freeThreshold + 1), 0);
});

test("shippingFee: cobra la tarifa plana por debajo del umbral", () => {
  assert.equal(shippingFee(SHIPPING.freeThreshold - 1), SHIPPING.flatFee);
  assert.equal(shippingFee(0), SHIPPING.flatFee);
  assert.equal(shippingFee(199999), SHIPPING.flatFee);
});

test("checkout: formulario válido pasa", () => {
  const res = checkoutFormSchema.safeParse(VALID_FORM);
  assert.equal(res.success, true);
});

test("checkout: email inválido rechazado", () => {
  const res = checkoutFormSchema.safeParse({ ...VALID_FORM, email: "no-es-correo" });
  assert.equal(res.success, false);
});

test("checkout: campos de envío requeridos", () => {
  const sinCiudad = checkoutFormSchema.safeParse({ ...VALID_FORM, shippingCity: "" });
  assert.equal(sinCiudad.success, false);
  const sinDireccion = checkoutFormSchema.safeParse({ ...VALID_FORM, shippingLine1: "" });
  assert.equal(sinDireccion.success, false);
});

test("checkout: zipCode y notes opcionales", () => {
  const { shippingZipCode: _zip, notes: _notes, ...sinOpcionales } = VALID_FORM;
  const res = checkoutFormSchema.safeParse(sinOpcionales);
  assert.equal(res.success, true);
});

test("filters: parámetros válidos se parsean", () => {
  const r = parseProductFiltersParams({
    q: "Real Madrid",
    liga: "la-liga",
    sort: "price-asc",
    talla: "s",
  });
  assert.equal(r.q, "Real Madrid");
  assert.equal(r.liga, "la-liga");
  assert.equal(r.sort, "price-asc");
  assert.equal(r.talla, "s");
});

test("filters: sort desconocido se rechaza (no rompe)", () => {
  const r = parseProductFiltersParams({ sort: "no-existe" });
  assert.notEqual(r.sort, "no-existe");
});