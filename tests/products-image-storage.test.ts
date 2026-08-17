import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deleteProductImage,
  ImageStorageError,
  isMissingObjectError,
  type ImageStorageDeleteDeps,
} from "../src/features/products/services/image-storage.ts";

// ---------------- isMissingObjectError ----------------

test("isMissingObjectError: null / sin error -> false", () => {
  assert.equal(isMissingObjectError(null), false);
  assert.equal(isMissingObjectError(undefined), false);
});

test("isMissingObjectError: 404 object not found -> true", () => {
  assert.equal(isMissingObjectError({ status: 404, message: "Object not found" }), true);
  assert.equal(isMissingObjectError({ statusCode: "404", message: "The resource was not found" }), true);
  assert.equal(isMissingObjectError({ code: "NoSuchKey", message: "Object not found" }), true);
});

test("isMissingObjectError: NoSuchKey -> true", () => {
  assert.equal(isMissingObjectError({ code: "NoSuchKey" }), true);
});

test("isMissingObjectError: errores reales -> false", () => {
  assert.equal(isMissingObjectError({ status: 403, message: "AccessDenied" }), false);
  assert.equal(isMissingObjectError({ status: 500, message: "Internal Server Error" }), false);
  assert.equal(isMissingObjectError({ code: "NoSuchBucket", message: "Bucket not found" }), false);
  assert.equal(isMissingObjectError({ status: 404, message: "Bucket not found" }), false);
  assert.equal(isMissingObjectError({ message: "Unauthorized" }), false);
  assert.equal(isMissingObjectError({ message: "Invalid API key" }), false);
  assert.equal(isMissingObjectError("texto"), false);
});

// ---------------- deleteProductImage ----------------

function makeDeps(overrides: Partial<ImageStorageDeleteDeps> = {}): {
  deps: ImageStorageDeleteDeps;
  calls: { removed: string[]; removedRows: { id: string; productId: string; wasPrimary: boolean }[] };
} {
  const calls: {
    removed: string[];
    removedRows: { id: string; productId: string; wasPrimary: boolean }[];
  } = { removed: [], removedRows: [] };
  const deps: ImageStorageDeleteDeps = {
    async findImage() {
      return { productId: "prod-1", isPrimary: true, storagePath: "products/prod-1/img.jpg" };
    },
    async removeFile(storagePath: string) {
      calls.removed.push(storagePath);
      return { error: null };
    },
    async deleteRow(id: string, productId: string, wasPrimary: boolean) {
      calls.removedRows.push({ id, productId, wasPrimary });
    },
    ...overrides,
  };
  return { deps, calls };
}

test("delete: el archivo existe -> se elimina archivo y después la fila", async () => {
  const { deps, calls } = makeDeps();
  await deleteProductImage("img-1", deps);

  assert.deepEqual(calls.removed, ["products/prod-1/img.jpg"]);
  assert.deepEqual(calls.removedRows, [{ id: "img-1", productId: "prod-1", wasPrimary: true }]);
});

test("delete: el archivo ya no existe (404) -> se elimina la fila sin error", async () => {
  const { deps, calls } = makeDeps();
  deps.removeFile = async (storagePath: string) => {
    calls.removed.push(storagePath);
    return { error: { status: 404, message: "Object not found" } };
  };

  await deleteProductImage("img-1", deps);

  assert.deepEqual(calls.removed, ["products/prod-1/img.jpg"]);
  assert.equal(calls.removedRows.length, 1);
});

test("delete: error real de Storage -> se propaga y NO se elimina la fila", async () => {
  const { deps, calls } = makeDeps();
  deps.removeFile = async (storagePath: string) => {
    calls.removed.push(storagePath);
    return { error: { status: 403, message: "AccessDenied" } };
  };

  await assert.rejects(
    () => deleteProductImage("img-1", deps),
    (err: unknown) => err instanceof ImageStorageError && err.message.includes("AccessDenied"),
  );
  assert.equal(calls.removedRows.length, 0);
});

test("delete: error 500 de Storage -> se propaga y NO se elimina la fila", async () => {
  const { deps, calls } = makeDeps({
    removeFile: async () => ({ error: new Error("Internal Server Error") }),
  });

  await assert.rejects(
    () => deleteProductImage("img-1", deps),
    (err: unknown) => err instanceof ImageStorageError && err.message.includes("Internal Server Error"),
  );
  assert.equal(calls.removedRows.length, 0);
});

test("delete: imagen externa (sin storagePath) -> solo se elimina la fila", async () => {
  const { deps, calls } = makeDeps({
    findImage: async () => ({ productId: "prod-1", isPrimary: false, storagePath: null }),
  });

  await deleteProductImage("img-1", deps);

  assert.deepEqual(calls.removed, []);
  assert.deepEqual(calls.removedRows, [{ id: "img-1", productId: "prod-1", wasPrimary: false }]);
});

test("delete: la fila no existe -> lanza ImageStorageError", async () => {
  const { deps, calls } = makeDeps({
    findImage: async () => null,
  });

  await assert.rejects(
    () => deleteProductImage("img-inexistente", deps),
    (err: unknown) => err instanceof ImageStorageError && err.message === "La imagen no existe.",
  );
  assert.deepEqual(calls.removed, []);
  assert.equal(calls.removedRows.length, 0);
});