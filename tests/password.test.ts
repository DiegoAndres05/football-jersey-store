import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/features/auth/services/password.ts";

test("hash → verify roundtrip con la contraseña correcta", () => {
  const hash = hashPassword("MiClaveSegura#1");
  assert.equal(verifyPassword("MiClaveSegura#1", hash), true);
});

test("contraseña incorrecta es rechazada", () => {
  const hash = hashPassword("ClaveCorrecta-2026");
  assert.equal(verifyPassword("clave-equivocada", hash), false);
  assert.equal(verifyPassword("ClaveCorrecta-2025", hash), false);
});

test("el hash tiene formato scrypt$salt$hash", () => {
  const hash = hashPassword("x");
  const parts = hash.split("$");
  assert.equal(parts[0], "scrypt");
  assert.equal(parts.length, 3);
  assert.equal(parts[1].length, 32); // 16 bytes hex
  assert.equal(parts[2].length, 128); // 64 bytes hex
});

test("el mismo texto genera hashes distintos (sal aleatoria)", () => {
  const a = hashPassword("MismaClave");
  const b = hashPassword("MismaClave");
  assert.notEqual(a, b);
});

test("hash corrupto o de otro formato no crashea y devuelve false", () => {
  assert.equal(verifyPassword("x", "scrypt$s$h"), false);
  assert.equal(verifyPassword("x", ""), false);
  assert.equal(verifyPassword("x", "1234567890"), false);
});