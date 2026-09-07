import { test } from "node:test";
import assert from "node:assert/strict";
import { setProductActiveIfExists } from "../src/features/catalog/server/product-visibility.ts";

test("setProductActiveIfExists: producto inexistente", async () => {
  const calls: boolean[] = [];
  const result = await setProductActiveIfExists("missing", false, {
    findProduct: async () => null,
    setActive: async (_id, next) => {
      calls.push(next);
    },
  });
  assert.deepEqual(result, { ok: false, error: "El producto no existe." });
  assert.deepEqual(calls, []);
});

test("setProductActiveIfExists: desactiva", async () => {
  const calls: { id: string; active: boolean }[] = [];
  const result = await setProductActiveIfExists("prod-1", false, {
    findProduct: async () => ({ id: "prod-1" }),
    setActive: async (id, isActive) => {
      calls.push({ id, active: isActive });
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls, [{ id: "prod-1", active: false }]);
});

test("setProductActiveIfExists: persistencia no se lanza", async () => {
  const result = await setProductActiveIfExists("prod-1", true, {
    findProduct: async () => ({ id: "prod-1" }),
    async setActive() {
      throw new Error("db");
    },
  });
  assert.deepEqual(result, { ok: false, error: "No se pudo actualizar la visibilidad. Intenta de nuevo." });
});
