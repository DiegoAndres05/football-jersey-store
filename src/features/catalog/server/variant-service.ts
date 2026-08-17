import { prisma } from "@/lib/prisma";

/**
 * Servicio de creación de variantes de producto.
 * - createVariantsForAllSizes: crea una variante por cada talla (omite las
 *   combinaciones versión+talla que ya existan). Se usa en el Admin.
 * - SKUs únicos vía buildUniqueSku (resuelve colisiones con sufijo -2, -3…).
 */

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "sin-nombre"
  );
}

type SkuClient = {
  productVariant: { findUnique(args: { where: { sku: string } }): Promise<unknown> };
};

export async function buildUniqueSku(
  client: SkuClient,
  product: { slug: string },
  version: { slug: string },
  size: { code: string },
): Promise<string> {
  const base = slugify(`${product.slug}-${version.slug}-${size.code}`);
  let sku = base;
  let i = 2;
  while (await client.productVariant.findUnique({ where: { sku } })) {
    sku = `${base}-${i++}`;
  }
  return sku;
}

export type VariantPriceData = {
  costPrice: number;
  salePrice: number;
  compareAtPrice: number | null;
  lowStockAt: number | null;
  weight: number;
};

export type VariantDbClient = {
  $transaction<T>(
    fn: (tx: {
      productVariant: {
        findUnique(args: { where: { sku: string } | { productId_versionId_sizeId: { productId: string; versionId: string; sizeId: string } } }): Promise<unknown>;
        create(args: { data: Record<string, unknown> }): Promise<unknown>;
      };
    }) => Promise<T>,
  ): Promise<T>;
};

export async function createVariantsForAllSizes(
  product: { id: string; slug: string },
  version: { id: string; slug: string },
  sizes: { id: string; code: string }[],
  data: VariantPriceData,
  db: VariantDbClient = prisma,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  await db.$transaction(async (tx) => {
    for (const size of sizes) {
      const clash = await tx.productVariant.findUnique({
        where: {
          productId_versionId_sizeId: { productId: product.id, versionId: version.id, sizeId: size.id },
        },
      });
      if (clash) {
        skipped += 1;
        continue;
      }
      await tx.productVariant.create({
        data: {
          productId: product.id,
          versionId: version.id,
          sizeId: size.id,
          sku: await buildUniqueSku(tx, product, version, size),
          ...data,
        },
      });
      created += 1;
    }
  });

  return { created, skipped };
}