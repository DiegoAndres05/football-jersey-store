import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatReasonList,
  productDeleteBlockedMessage,
  productDeleteBlockers,
} from "../src/features/catalog/product-delete-rules.ts";
import {
  deleteProductIfAllowed,
  type ProductDeleteDeps,
  type ProductDeleteRecord,
} from "../src/features/catalog/server/product-delete.ts";

test("productDeleteBlockers: vacío cuando no hay dependencias", () => {
  assert.deepEqual(productDeleteBlockers({ variants: 0, suppliers: 0, images: 0 }), []);
});

test("productDeleteBlockers: lista variantes, proveedores e imágenes", () => {
  assert.deepEqual(productDeleteBlockers({ variants: 20, suppliers: 3, images: 2 }), [
    "20 variante(s)",
    "3 proveedor(es)",
    "2 imagen(es)",
  ]);
});

test("productDeleteBlockers: omite conteos en cero", () => {
  assert.deepEqual(productDeleteBlockers({ variants: 1, suppliers: 0, images: 0 }), ["1 variante(s)"]);
  assert.deepEqual(productDeleteBlockers({ variants: 0, suppliers: 2, images: 0 }), ["2 proveedor(es)"]);
  assert.deepEqual(productDeleteBlockers({ variants: 0, suppliers: 0, images: 4 }), ["4 imagen(es)"]);
});

test("formatReasonList: une en español", () => {
  assert.equal(formatReasonList(["1 variante(s)"]), "1 variante(s)");
  assert.equal(formatReasonList(["1 variante(s)", "2 proveedor(es)"]), "1 variante(s) y 2 proveedor(es)");
  assert.equal(
    formatReasonList(["1 variante(s)", "2 proveedor(es)", "3 imagen(es)"]),
    "1 variante(s), 2 proveedor(es) y 3 imagen(es)",
  );
});

test("productDeleteBlockedMessage: tono del admin", () => {
  const msg = productDeleteBlockedMessage(["20 variante(s)", "3 proveedor(es)"]);
  assert.equal(
    msg,
    "No se puede eliminar: tiene 20 variante(s) y 3 proveedor(es). Quita primero esas dependencias.",
  );
});

function record(overrides: Partial<ProductDeleteRecord> = {}): ProductDeleteRecord {
  return {
    id: "prod-1",
    images: [],
    _count: { variants: 0, supplierProducts: 0, images: 0 },
    ...overrides,
  };
}

function makeDeps(product: ProductDeleteRecord | null, options?: {
  deleteProduct?: () => Promise<void>;
  findProduct?: () => Promise<ProductDeleteRecord | null>;
}): { deps: ProductDeleteDeps; calls: { deleted: string[]; images: string[]; storage: string[][] } } {
  const calls = { deleted: [] as string[], images: [] as string[], storage: [] as string[][] };
  const deps: ProductDeleteDeps = {
    findProduct: options?.findProduct ?? (async () => product),
    async removeStorage(paths) {
      calls.storage.push(paths);
    },
    async deleteImages(productId) {
      calls.images.push(productId);
    },
    deleteProduct: options?.deleteProduct ?? (async (id) => {
      calls.deleted.push(id);
    }),
  };
  return { deps, calls };
}

test("deleteProductIfAllowed: bloqueado con variantes no toca la BD", async () => {
  const { deps, calls } = makeDeps(record({ _count: { variants: 20, supplierProducts: 3, images: 0 } }));
  const result = await deleteProductIfAllowed("prod-1", deps);
  assert.deepEqual(result, {
    ok: false,
    error: "No se puede eliminar: tiene 20 variante(s) y 3 proveedor(es). Quita primero esas dependencias.",
  });
  assert.deepEqual(calls.deleted, []);
  assert.deepEqual(calls.images, []);
  assert.deepEqual(calls.storage, []);
});

test("deleteProductIfAllowed: bloqueado solo con imágenes", async () => {
  const { deps, calls } = makeDeps(record({
    _count: { variants: 0, supplierProducts: 0, images: 2 },
    images: [
      { id: "img-1", storagePath: "products/prod-1/a.jpg" },
      { id: "img-2", storagePath: null },
    ],
  }));
  const result = await deleteProductIfAllowed("prod-1", deps);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /2 imagen\(es\)/);
  }
  assert.deepEqual(calls.deleted, []);
  assert.deepEqual(calls.storage, []);
});

test("deleteProductIfAllowed: producto inexistente", async () => {
  const { deps, calls } = makeDeps(null);
  const result = await deleteProductIfAllowed("missing", deps);
  assert.deepEqual(result, { ok: false, error: "El producto no existe." });
  assert.deepEqual(calls.deleted, []);
});

test("deleteProductIfAllowed: elimina producto elegible", async () => {
  const { deps, calls } = makeDeps(record());
  const result = await deleteProductIfAllowed("prod-1", deps);
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls.images, ["prod-1"]);
  assert.deepEqual(calls.deleted, ["prod-1"]);
  assert.deepEqual(calls.storage, []);
});

test("deleteProductIfAllowed: error de persistencia no se lanza", async () => {
  const { deps } = makeDeps(record(), {
    async deleteProduct() {
      throw new Error("Foreign key constraint failed");
    },
  });
  const result = await deleteProductIfAllowed("prod-1", deps);
  assert.deepEqual(result, { ok: false, error: "No se pudo eliminar el producto. Intenta de nuevo." });
});
