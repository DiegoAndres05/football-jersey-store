import { prisma } from "@/lib/prisma";

export type AdminInventoryStockStatus = "DISPONIBLE" | "STOCK_BAJO" | "AGOTADO" | "BAJO_PEDIDO";

export type AdminInventoryProjectionRow = {
  variantId: string;
  productName: string;
  productSlug: string;
  sizeName: string;
  versionName: string;
  sku: string;
  stock: number;
  lowStockAt: number | null;
  allowsBackorder: boolean;
  status: AdminInventoryStockStatus;
};

export async function getAdminInventoryProjection(): Promise<AdminInventoryProjectionRow[]> {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: { select: { name: true, slug: true } },
      size: { select: { name: true } },
      version: { select: { name: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { size: { position: "asc" } }],
  });

  if (variants.length === 0) {
    return [];
  }

  const movementGroups = await prisma.inventoryMovement.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variants.map((variant) => variant.id) } },
    _sum: { quantity: true },
  });

  const stockByVariant = new Map(movementGroups.map((entry) => [entry.variantId, entry._sum.quantity ?? 0]));

  return variants.map((variant) => {
    const stock = stockByVariant.get(variant.id) ?? 0;
    const lowStockAt = variant.lowStockAt ?? null;
    const status: AdminInventoryStockStatus =
      stock <= 0
        ? "AGOTADO"
        : lowStockAt !== null && stock <= lowStockAt
          ? "STOCK_BAJO"
          : variant.allowsBackorder
            ? "BAJO_PEDIDO"
            : "DISPONIBLE";

    return {
      variantId: variant.id,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      sizeName: variant.size.name,
      versionName: variant.version.name,
      sku: variant.sku,
      stock,
      lowStockAt,
      allowsBackorder: variant.allowsBackorder,
      status,
    };
  });
}
