import type { DeliveryMode } from "@/features/products/types/delivery-mode";

export type DeliveryLine = {
  variantId: string;
  quantity: number;
  deliveryMode: DeliveryMode;
};

export type PlannedMovement = {
  variantId: string;
  quantity: number;
};

export type InventoryPlanResult =
  | { ok: true; movements: PlannedMovement[] }
  | { ok: false; error: string };

/**
 * Decide qué líneas reservan stock (solo INMEDIATA) y valida que el stock
 * físico (ledger) alcance. Las líneas BAJO_PEDIDO no reservan nada: no hay
 * existencias físicas que apartar hasta conseguir la prenda.
 */
export function planInventoryMovements(
  lines: DeliveryLine[],
  stockById: ReadonlyMap<string, number>,
): InventoryPlanResult {
  const movements: PlannedMovement[] = [];
  for (const line of lines) {
    if (line.deliveryMode === "BAJO_PEDIDO") continue;
    const stock = stockById.get(line.variantId) ?? 0;
    if (stock < line.quantity) {
      return {
        ok: false,
        error:
          "No hay stock suficiente para un artículo de entrega inmediata. Reduce la cantidad o elige 'Bajo pedido'.",
      };
    }
    movements.push({ variantId: line.variantId, quantity: -line.quantity });
  }
  return { ok: true, movements };
}