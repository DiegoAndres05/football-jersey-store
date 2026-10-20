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

export const CASH_CATALOG_RESULT_LIMIT = 40;

export type CashCatalogItem = {
  productName: string;
  teamName: string;
  leagueName: string;
  seasonName: string;
  versionName: string;
  sizeName: string;
};

export type CashCatalogFilter = {
  query: string;
  league: string;
  team: string;
  season: string;
  version: string;
  size: string;
};

function foldCashSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function filterCashCatalog<T extends CashCatalogItem>(
  items: T[],
  filter: CashCatalogFilter,
): { mode: "all" | "prompt" | "search"; items: T[]; matchCount: number } {
  const needle = foldCashSearch(filter.query);
  const hasChoice = Boolean(filter.league || filter.team || filter.season || filter.version || filter.size || needle.length >= 2);
  if (!hasChoice && items.length <= CASH_CATALOG_RESULT_LIMIT) {
    return { mode: "all", items, matchCount: items.length };
  }
  if (!hasChoice) return { mode: "prompt", items: [], matchCount: 0 };

  const matches = items.filter((item) => {
    if (filter.league && item.leagueName !== filter.league) return false;
    if (filter.team && item.teamName !== filter.team) return false;
    if (filter.season && item.seasonName !== filter.season) return false;
    if (filter.version && item.versionName !== filter.version) return false;
    if (filter.size && item.sizeName !== filter.size) return false;
    if (needle.length >= 2) {
      const haystack = foldCashSearch([
        item.productName,
        item.teamName,
        item.leagueName,
        item.seasonName,
        item.versionName,
        item.sizeName,
      ].join(" "));
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
  return {
    mode: "search",
    items: matches.slice(0, CASH_CATALOG_RESULT_LIMIT),
    matchCount: matches.length,
  };
}

export function orderVisibleToStaff(role: string, paymentMethod: string): boolean {
  if (isAdminRole(role)) return true;
  if (isVendorRole(role)) return paymentMethod === "CASH";
  return false;
}
