import { isAdminRole, isVendorRole } from "@/features/auth/domain/staff-role";

export type CashSaleLine = {
  variantId: string;
  quantity: number;
  unitPrice: number;
};

export type CashSaleQuote = {
  subtotal: number;
  shippingFee: 0;
  discountAmount: 0;
  total: number;
};

export function quoteCashSale(lines: CashSaleLine[]): { ok: true; quote: CashSaleQuote } | { ok: false; error: string } {
  if (lines.length === 0) return { ok: false, error: "Agrega al menos una prenda." };
  let subtotal = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return { ok: false, error: "La cantidad no es válida." };
    }
    if (!Number.isInteger(line.unitPrice) || line.unitPrice < 0) {
      return { ok: false, error: "El precio no es válido." };
    }
    subtotal += line.unitPrice * line.quantity;
  }
  return { ok: true, quote: { subtotal, shippingFee: 0, discountAmount: 0, total: subtotal } };
}

export function cashSaleHasStock(
  lines: { variantId: string; quantity: number }[],
  stockByVariant: ReadonlyMap<string, number>,
): boolean {
  const needed = new Map<string, number>();
  for (const line of lines) {
    needed.set(line.variantId, (needed.get(line.variantId) ?? 0) + line.quantity);
  }
  for (const [variantId, quantity] of needed) {
    if ((stockByVariant.get(variantId) ?? 0) < quantity) return false;
  }
  return true;
}

/** El ledger suma quantity. Una venta resta, igual que la reserva. */
export function cashSaleMovementQuantity(quantity: number): number {
  return -quantity;
}

export function isCashOrderHiddenFromPublic(paymentMethod: string): boolean {
  return paymentMethod === "CASH";
}

export function shouldPersistCashSale(existingCode: string | null): boolean {
  return existingCode === null;
}

export function cashCounterEmail(code: string): string {
  return `mostrador+${code}@flashsports.invalid`;
}

export function orderVisibleToStaff(role: string, paymentMethod: string): boolean {
  if (isAdminRole(role)) return true;
  if (isVendorRole(role)) return paymentMethod === "CASH";
  return false;
}
