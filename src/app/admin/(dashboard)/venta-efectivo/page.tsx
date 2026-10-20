import { prisma } from "@/lib/prisma";
import { getImmediateStockByVariantIds } from "@/features/products/repositories/product-repository";
import { CashSaleForm } from "./cash-sale-form";

export default async function CashSalePage() {
  const variants = await prisma.productVariant.findMany({
    where: { product: { isActive: true } },
    include: {
      product: {
        select: {
          name: true,
          team: { select: { name: true, league: { select: { name: true } } } },
          season: { select: { name: true } },
        },
      },
      size: { select: { name: true } },
      version: { select: { name: true } },
    },
    orderBy: [{ product: { team: { name: "asc" } } }, { product: { name: "asc" } }, { size: { position: "asc" } }],
  });
  const stock = await getImmediateStockByVariantIds(variants.map((variant) => variant.id));
  const stockById = new Map(stock.map((row) => [row.variantId, row.stock]));
  const options = variants.flatMap((variant) => {
    const available = stockById.get(variant.id) ?? 0;
    if (available <= 0) return [];
    return [{
      id: variant.id,
      productName: variant.product.name,
      teamName: variant.product.team.name,
      leagueName: variant.product.team.league?.name ?? "",
      seasonName: variant.product.season.name,
      versionName: variant.version.name,
      sizeName: variant.size.name,
      price: variant.salePrice,
      stock: available,
    }];
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Venta en efectivo</h2>
        <p className="text-sm text-muted-foreground">El pedido queda pagado, sin envío y solo visible en el panel. El cliente no recibe correo.</p>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay prendas con stock inmediato.</p>
      ) : (
        <CashSaleForm options={options} />
      )}
    </div>
  );
}
