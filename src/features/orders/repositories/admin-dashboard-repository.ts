import { prisma } from "@/lib/prisma";

const PAID_STATUSES = ["PAID", "VALIDATING", "PREPARING", "SHIPPED", "DELIVERED"] as const;

export async function getAdminDashboardSummary() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [orders, revenue, activeProducts, pendingPayments, alertRows] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 12,
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: since }, status: { in: [...PAID_STATUSES] } },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.productVariant.findMany({
      include: {
        product: { select: { name: true, slug: true } },
        size: { select: { name: true } },
        version: { select: { name: true } },
      },
      orderBy: [{ product: { name: "asc" } }, { size: { position: "asc" } }],
    }).then(async (variants) => {
      const group = await prisma.inventoryMovement.groupBy({
        by: ["variantId"],
        where: { variantId: { in: variants.map((variant) => variant.id) } },
        _sum: { quantity: true },
      });
      const stockByVariant = new Map(group.map((entry) => [entry.variantId, entry._sum.quantity ?? 0]));
      return variants
        .map((variant) => {
          const stock = stockByVariant.get(variant.id) ?? 0;
          const lowStockAt = variant.lowStockAt ?? null;
          const status = stock <= 0 ? "AGOTADO" : lowStockAt !== null && stock <= lowStockAt ? "STOCK_BAJO" : "DISPONIBLE";
          return {
            variantId: variant.id,
            productName: variant.product.name,
            productSlug: variant.product.slug,
            sizeName: variant.size.name,
            versionName: variant.version.name,
            sku: variant.sku,
            stock,
            lowStockAt,
            status,
          };
        })
        .filter((variant) => variant.stock <= 0 || (variant.lowStockAt !== null && variant.stock <= variant.lowStockAt))
        .slice(0, 10);
    }),
  ]);

  const outOfStockCount = alertRows.filter((row) => row.stock <= 0).length;
  const lowStockCount = alertRows.filter((row) => row.stock > 0 && row.lowStockAt !== null && row.stock <= row.lowStockAt).length;

  return {
    ordersLast30Days: orders.length,
    paidRevenueLast30Days: revenue._sum.total ?? 0,
    activeProducts,
    pendingPayments,
    lowStockCount,
    outOfStockCount,
    alerts: alertRows,
  };
}
