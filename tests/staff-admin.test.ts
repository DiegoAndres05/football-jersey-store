import assert from "node:assert/strict";
import test from "node:test";
import { staffChangeAllowed, vendorMayOpen } from "../src/features/auth/domain/staff-role.ts";

test("un correo duplicado se rechaza antes de crear otro trabajador", () => {
  const emails = new Set(["ana@flashsports.shop"]);
  const incoming = "Ana@Flashsports.shop".trim().toLowerCase();
  assert.equal(emails.has(incoming), true);
});

test("no se puede quitar al último administrador activo", () => {
  const demote = staffChangeAllowed({
    actorRole: "ADMIN",
    targetRole: "ADMIN",
    targetIsActive: true,
    nextRole: "VENDOR",
    otherActiveAdmins: 0,
  });
  const deactivate = staffChangeAllowed({
    actorRole: "ADMIN",
    targetRole: "SUPER_ADMIN",
    targetIsActive: true,
    deactivate: true,
    otherActiveAdmins: 0,
  });
  const allowed = staffChangeAllowed({
    actorRole: "ADMIN",
    targetRole: "ADMIN",
    targetIsActive: true,
    nextRole: "VENDOR",
    otherActiveAdmins: 1,
  });
  assert.equal(demote.ok, false);
  assert.equal(deactivate.ok, false);
  assert.equal(allowed.ok, true);
});

test("un vendedor no administra personal ni abre esa pantalla", () => {
  const change = staffChangeAllowed({
    actorRole: "VENDOR",
    targetRole: "VENDOR",
    targetIsActive: true,
    deactivate: true,
    otherActiveAdmins: 2,
  });
  assert.equal(change.ok, false);
  if (!change.ok) assert.equal(change.error, "No autorizado.");
  assert.equal(vendorMayOpen("/admin/personal"), false);
  assert.equal(vendorMayOpen("/admin/pedidos"), true);
  assert.equal(vendorMayOpen("/admin/venta-efectivo"), true);
});
