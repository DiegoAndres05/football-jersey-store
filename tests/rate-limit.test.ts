import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isLoginBlocked,
  registerLoginFailure,
  clearLoginAttempts,
  loginWindowMinutes,
} from "../src/features/auth/server/rate-limit.ts";

test("bloquea el quinto intento fallido consecutivo", () => {
  clearLoginAttempts("test@x.co");
  const estados: boolean[] = [];
  for (let i = 1; i <= 6; i++) {
    if (!isLoginBlocked("test@x.co")) registerLoginFailure("test@x.co");
    estados.push(isLoginBlocked("test@x.co"));
  }
  // intentos 1-4 libres, 5º registra, el 6º en adelante bloqueados
  assert.deepEqual(estados.slice(0, 5), [false, false, false, false, true]);
  assert.equal(estados[5], true);
});

test("clearLoginAttempts restablece el bloqueo", () => {
  clearLoginAttempts("reset@x.co");
  for (let i = 0; i < 5; i++) registerLoginFailure("reset@x.co");
  assert.equal(isLoginBlocked("reset@x.co"), true);
  clearLoginAttempts("reset@x.co");
  assert.equal(isLoginBlocked("reset@x.co"), false);
});

test("la ventana expira y el conteo se reinicia", () => {
  const originalNow = Date.now;
  let fakeNow = 1_000_000_000_000;
  Date.now = () => fakeNow;
  try {
    clearLoginAttempts("ventana@x.co");
    for (let i = 0; i < 5; i++) registerLoginFailure("ventana@x.co");
    assert.equal(isLoginBlocked("ventana@x.co"), true);
    fakeNow += loginWindowMinutes() * 60_000 + 1000;
    assert.equal(isLoginBlocked("ventana@x.co"), false);
    // siguiente fallo reinicia el conteo desde 1 (no bloquea)
    registerLoginFailure("ventana@x.co");
    assert.equal(isLoginBlocked("ventana@x.co"), false);
  } finally {
    Date.now = originalNow;
  }
});

test("el bloqueo es por clave (email), no global", () => {
  clearLoginAttempts("a@x.co");
  clearLoginAttempts("b@x.co");
  for (let i = 0; i < 5; i++) registerLoginFailure("a@x.co");
  assert.equal(isLoginBlocked("a@x.co"), true);
  assert.equal(isLoginBlocked("b@x.co"), false);
});