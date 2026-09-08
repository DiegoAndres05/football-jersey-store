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

export type ReservationRow = {
  variantId: string;
  quantity: number;
};

/**
 * Compensates RESERVATION rows (signed negatives from createOrder) with
 * CANCELLATION quantities that restore SUM(quantity) per variant.
 * Empty input (e.g. only BAJO_PEDIDO) → no movements.
 */
export function planReservationCancellations(
  reservations: readonly ReservationRow[],
): PlannedMovement[] {
  const byVariant = new Map<string, number>();
  for (const row of reservations) {
    const restore = -row.quantity;
    if (restore === 0) continue;
    byVariant.set(row.variantId, (byVariant.get(row.variantId) ?? 0) + restore);
  }
  return [...byVariant.entries()].map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}

export function shouldReleaseReservations(input: {
  currentStatus: string;
  outcome: "APPROVED" | "REJECTED";
  existingCancellationCount: number;
}): boolean {
  return (
    input.currentStatus === "PENDING_PAYMENT" &&
    input.outcome === "REJECTED" &&
    input.existingCancellationCount === 0
  );
}