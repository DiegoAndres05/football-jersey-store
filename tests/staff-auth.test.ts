import assert from "node:assert/strict";
import test from "node:test";
import {
  STAFF_LOGIN_ERROR,
  STAFF_SESSION_MAX_AGE_SECONDS,
  isAdminRole,
  isStaffAuthCutoverEnabled,
  isStaffRole,
  isStaffSessionExpired,
  isVendorRole,
} from "../src/features/auth/domain/staff-role.ts";
import {
  clearLoginAttempts,
  isLoginBlocked,
  loginWindowMinutes,
  registerLoginFailure,
} from "../src/features/auth/server/rate-limit.ts";

test("el mensaje de acceso fallido no revela si el correo existe", () => {
  assert.equal(STAFF_LOGIN_ERROR, "Correo o contraseña inválidos.");
  assert.equal(STAFF_LOGIN_ERROR.includes("no existe"), false);
});

test("cinco fallos bloquean el ingreso durante 15 minutos", () => {
  const key = "staff-auth-lock@example.com";
  clearLoginAttempts(key);
  for (let attempt = 0; attempt < 5; attempt += 1) registerLoginFailure(key);
  assert.equal(isLoginBlocked(key), true);
  assert.equal(loginWindowMinutes(), 15);
  clearLoginAttempts(key);
  assert.equal(isLoginBlocked(key), false);
});

test("un cliente no entra al panel y el vendedor no es administrador", () => {
  assert.equal(isStaffRole("CUSTOMER"), false);
  assert.equal(isAdminRole("VENDOR"), false);
  assert.equal(isVendorRole("VENDOR"), true);
  assert.equal(isAdminRole("ADMIN"), true);
  assert.equal(isAdminRole("SUPER_ADMIN"), true);
});

test("la sesión de personal vence a las 12 horas", () => {
  const issuedAt = 1_000_000;
  assert.equal(STAFF_SESSION_MAX_AGE_SECONDS, 12 * 60 * 60);
  assert.equal(isStaffSessionExpired(issuedAt, issuedAt + STAFF_SESSION_MAX_AGE_SECONDS * 1000), false);
  assert.equal(isStaffSessionExpired(issuedAt, issuedAt + STAFF_SESSION_MAX_AGE_SECONDS * 1000 + 1), true);
});

test("la cookie antigua solo se acepta mientras el corte está apagado", () => {
  assert.equal(isStaffAuthCutoverEnabled(undefined), false);
  assert.equal(isStaffAuthCutoverEnabled("false"), false);
  assert.equal(isStaffAuthCutoverEnabled("true"), true);
});
