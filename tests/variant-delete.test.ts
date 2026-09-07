import { test } from "node:test";
import assert from "node:assert/strict";
import {
  variantDeleteBlockedMessage,
  variantDeleteIsBlocked,
} from "../src/features/catalog/variant-delete-rules.ts";
import {
  deleteVariantIfAllowed,
  type VariantDeleteDeps,
  type VariantDeleteRecord,
} from "../src/features/catalog/server/variant-delete.ts";

test("variantDeleteIsBlocked: movimientos conservan el ledger", () => {
  assert.equal(variantDeleteIsBlocked(0), false);
  assert.equal(variantDeleteIsBlocked(1), true);
});

test("variantDeleteBlockedMessage: tono del admin", () => {
  assert.equal(
    variantDeleteBlockedMessage(1),
    "No se puede eliminar: tiene 1 movimiento(s) de inventario. Conserva el histórico.",
  );
});

function record(overrides: Partial<VariantDeleteRecord> = {}): VariantDeleteRecord {
  return { id: "var-1", productSlug: "real-madrid", movementCount: 0, ...overrides };
}

function makeDeps(variant: VariantDeleteRecord | null, options?: { deleteVariant?: () => Promise<void> }) {
  const calls = { deleted: [] as string[] };
  const deps: VariantDeleteDeps = {
    findVariant: async () => variant,
    deleteVariant: options?.deleteVariant ?? (async (id) => {
      calls.deleted.push(id);
    }),
  };
  return { deps, calls };
}

test("deleteVariantIfAllowed: bloqueado con movimientos no toca la BD", async () => {
  const { deps, calls } = makeDeps(record({ movementCount: 1 }));
  const result = await deleteVariantIfAllowed("var-1", deps);
  assert.deepEqual(result, {
    ok: false,
    error: "No se puede eliminar: tiene 1 movimiento(s) de inventario. Conserva el histórico.",
  });
  assert.deepEqual(calls.deleted, []);
});

test("deleteVariantIfAllowed: inexistente", async () => {
  const { deps, calls } = makeDeps(null);
  const result = await deleteVariantIfAllowed("missing", deps);
  assert.deepEqual(result, { ok: false, error: "La variante no existe." });
  assert.deepEqual(calls.deleted, []);
});

test("deleteVariantIfAllowed: elimina variante sin ledger", async () => {
  const { deps, calls } = makeDeps(record());
  const result = await deleteVariantIfAllowed("var-1", deps);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.productSlug, "real-madrid");
  assert.deepEqual(calls.deleted, ["var-1"]);
});

test("deleteVariantIfAllowed: error de persistencia no se lanza", async () => {
  const { deps } = makeDeps(record(), {
    async deleteVariant() {
      throw new Error("FK");
    },
  });
  const result = await deleteVariantIfAllowed("var-1", deps);
  assert.deepEqual(result, { ok: false, error: "No se pudo eliminar la variante. Intenta de nuevo." });
});
