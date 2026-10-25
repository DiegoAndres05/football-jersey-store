export type CatalogStockCounts = {
  total: number;
  purchasable: number;
  soldOut: number;
};

/**
 * Texto de un listado de liga o equipo.
 * «Disponible» = se puede comprar (hay stock en alguna talla, o bajo pedido).
 * «Agotado» = ninguna talla tiene stock y ninguna admite bajo pedido.
 */
export function formatCatalogStockLabel(counts: CatalogStockCounts): string {
  const total = Math.max(0, counts.total);
  const soldOut = Math.min(total, Math.max(0, counts.soldOut));
  const purchasable = Math.max(0, total - soldOut);
  const products = total === 1 ? "producto" : "productos";

  if (total === 0) return "Próximamente";
  if (soldOut === 0) {
    return `${purchasable} ${purchasable === 1 ? "producto" : "productos"} disponible${purchasable === 1 ? "" : "s"}`;
  }
  if (purchasable === 0) {
    return `${total} ${products}, ${total === 1 ? "agotado" : "agotados"}`;
  }
  return `${total} ${products} · ${purchasable} disponible${purchasable === 1 ? "" : "s"} · ${soldOut} agotado${soldOut === 1 ? "" : "s"}`;
}
