/**
 * Tope de entrega inmediata: suma de líneas INMEDIATA por variante ≤ stock.
 * BAJO_PEDIDO no cuenta. Sin conversión silenciosa a bajo encargo.
 */

export const IMMEDIATE_AT_CAP_MESSAGE =
  "No hay más unidades de entrega inmediata para esta talla.";

export type ImmediateCartLine = {
  lineId: string;
  variantId: string;
  deliveryMode: "INMEDIATA" | "BAJO_PEDIDO";
  quantity: number;
};

export type CartAdjustment =
  | { type: "removed"; lineId: string; variantId: string; quantity: number }
  | { type: "reduced"; lineId: string; variantId: string; from: number; to: number };

export function immediateQty(items: readonly ImmediateCartLine[], variantId: string): number {
  return items
    .filter((item) => item.deliveryMode === "INMEDIATA" && item.variantId === variantId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function remainingImmediate(
  items: readonly ImmediateCartLine[],
  variantId: string,
  stock: number,
): number {
  return Math.max(0, stock - immediateQty(items, variantId));
}

/** Máximo que puede tener una línea inmediata concreta dado el stock de su variante. */
export function maxImmediateForLine(
  items: readonly ImmediateCartLine[],
  lineId: string,
  stock: number,
): number {
  const line = items.find((item) => item.lineId === lineId);
  if (!line || line.deliveryMode !== "INMEDIATA") return Number.POSITIVE_INFINITY;
  const others = immediateQty(
    items.filter((item) => item.lineId !== lineId),
    line.variantId,
  );
  return Math.max(0, stock - others);
}

export function reconcileImmediateCart<T extends ImmediateCartLine>(
  items: readonly T[],
  stockByVariantId: ReadonlyMap<string, number>,
): { items: T[]; adjustments: CartAdjustment[] } {
  const adjustments: CartAdjustment[] = [];
  const next: T[] = [];

  const immediateByVariant = new Map<string, T[]>();
  for (const item of items) {
    if (item.deliveryMode !== "INMEDIATA") continue;
    const list = immediateByVariant.get(item.variantId) ?? [];
    list.push(item);
    immediateByVariant.set(item.variantId, list);
  }

  const qtyByLineId = new Map<string, number>();
  const removedLineIds = new Set<string>();

  for (const [variantId, lines] of immediateByVariant) {
    const stock = stockByVariantId.get(variantId) ?? 0;
    if (stock <= 0) {
      for (const line of lines) {
        removedLineIds.add(line.lineId);
        adjustments.push({
          type: "removed",
          lineId: line.lineId,
          variantId,
          quantity: line.quantity,
        });
      }
      continue;
    }

    let remaining = stock;
    for (const line of lines) {
      if (remaining <= 0) {
        removedLineIds.add(line.lineId);
        adjustments.push({
          type: "removed",
          lineId: line.lineId,
          variantId,
          quantity: line.quantity,
        });
        continue;
      }
      if (line.quantity > remaining) {
        adjustments.push({
          type: "reduced",
          lineId: line.lineId,
          variantId,
          from: line.quantity,
          to: remaining,
        });
        qtyByLineId.set(line.lineId, remaining);
        remaining = 0;
      } else {
        remaining -= line.quantity;
      }
    }
  }

  for (const item of items) {
    if (removedLineIds.has(item.lineId)) continue;
    const reduced = qtyByLineId.get(item.lineId);
    next.push(reduced === undefined ? item : { ...item, quantity: reduced });
  }

  return { items: next, adjustments };
}

export function formatReconcileMessage(adjustments: readonly CartAdjustment[]): string {
  const removed = adjustments.some((item) => item.type === "removed");
  const reduced = adjustments.some((item) => item.type === "reduced");
  if (removed && reduced) {
    return "Actualizamos tu carrito: algunas unidades de entrega inmediata ya no están disponibles.";
  }
  if (removed) {
    return "Quitamos del carrito las unidades de entrega inmediata que ya no tienen stock.";
  }
  return "Redujimos la cantidad de entrega inmediata al stock disponible.";
}
