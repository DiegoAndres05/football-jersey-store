import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildUniqueSku,
  createVariantsForAllSizes,
  type VariantDbClient,
} from "../src/features/catalog/server/variant-service.ts";

// ---------------- buildUniqueSku ----------------

test("buildUniqueSku: devuelve el sku base cuando está libre", async () => {
  const skus = new Set<string>();
  const client = { productVariant: { async findUnique({ where }: { where: { sku: string } }) { return skus.has(where.sku) ? { id: "x" } : null; } } };
  const sku = await buildUniqueSku(client as never, { slug: "real-madrid" }, { slug: "fan" }, { code: "S" });
  assert.equal(sku, "real-madrid-fan-s");
});

test("buildUniqueSku: añade sufijo -2, -3 si el sku está ocupado", async () => {
  const skus = new Set(["real-madrid-fan-m", "real-madrid-fan-m-2"]);
  const client = { productVariant: { async findUnique({ where }: { where: { sku: string } }) { return skus.has(where.sku) ? { id: "x" } : null; } } };
  const sku = await buildUniqueSku(client as never, { slug: "real-madrid" }, { slug: "fan" }, { code: "M" });
  assert.equal(sku, "real-madrid-fan-m-3");
});

// ---------------- createVariantsForAllSizes ----------------

function makeFakeDb(): { db: VariantDbClient; skus: Set<string>; combos: Set<string> } {
  const skus = new Set<string>();
  const combos = new Set<string>();
  const key = (p: string, v: string, s: string) => `${p}|${v}|${s}`;
  const tx = {
    productVariant: {
      async findUnique({ where }: { where: { sku?: string; productId_versionId_sizeId?: { productId: string; versionId: string; sizeId: string } } }) {
        if (where.sku) return skus.has(where.sku) ? { id: "x" } : null;
        if (where.productId_versionId_sizeId) {
          const c = where.productId_versionId_sizeId;
          return combos.has(key(c.productId, c.versionId, c.sizeId)) ? { id: "x" } : null;
        }
        return null;
      },
      async create({ data }: { data: { sku: string; productId: string; versionId: string; sizeId: string } }) {
        skus.add(data.sku);
        combos.add(key(data.productId, data.versionId, data.sizeId));
        return { id: "y" };
      },
    },
  };
  const db: VariantDbClient = {
    async $transaction(fn) {
      return fn(tx as never);
    },
  };
  return { db, skus, combos };
}

const product = { id: "p1", slug: "test-product" };
const version = { id: "v1", slug: "fan" };
const sizes = [
  { id: "s1", code: "S" },
  { id: "s2", code: "M" },
  { id: "s3", code: "L" },
];
const data = { costPrice: 100000, salePrice: 250000, compareAtPrice: null, lowStockAt: null, weight: 400 };

test("createVariantsForAllSizes: crea una variante por cada talla", async () => {
  const { db, skus } = makeFakeDb();
  const result = await createVariantsForAllSizes(product, version, sizes, data, db);
  assert.deepEqual(result, { created: 3, skipped: 0 });
  assert.deepEqual([...skus].sort(), ["test-product-fan-l", "test-product-fan-m", "test-product-fan-s"]);
});

test("createVariantsForAllSizes: omite combinaciones ya existentes", async () => {
  const { db, combos } = makeFakeDb();
  combos.add("p1|v1|s2");
  const result = await createVariantsForAllSizes(product, version, sizes, data, db);
  assert.deepEqual(result, { created: 2, skipped: 1 });
});

test("createVariantsForAllSizes: sin tallas no crea nada", async () => {
  const { db } = makeFakeDb();
  const result = await createVariantsForAllSizes(product, version, [], data, db);
  assert.deepEqual(result, { created: 0, skipped: 0 });
});