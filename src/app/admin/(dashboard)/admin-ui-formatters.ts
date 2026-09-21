import { formatPrice, formatPriceShort } from "@/lib/utils";
import type { AdminDeliveryMode, AdminOrderFilterMode, AdminStockStatus } from "./admin-ui-types";

export const adminFocusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]";

export function formatAdminCurrency(value: number) {
  return formatPrice(value);
}

export function formatAdminShortCurrency(value: number) {
  return formatPriceShort(value);
}

export function normalizeAdminOrderFilter(value: string | null | undefined): AdminOrderFilterMode {
  if (value === "INMEDIATA" || value === "BAJO_PEDIDO") {
    return value;
  }
  return "TODOS";
}

export function formatAdminDeliveryMode(mode: AdminDeliveryMode | string | null | undefined) {
  switch (mode) {
    case "INMEDIATA":
      return "Entrega inmediata";
    case "BAJO_PEDIDO":
      return "Bajo pedido";
    case "NO_DISPONIBLE":
      return "No disponible";
    default:
      return "No disponible";
  }
}

export function describeStockStatus(stock: number, lowStockAt?: number | null): AdminStockStatus {
  if (lowStockAt !== undefined && lowStockAt !== null && stock > 0 && stock <= lowStockAt) {
    return "STOCK_BAJO";
  }
  if (stock <= 0) {
    return "AGOTADO";
  }
  return "DISPONIBLE";
}

export function stockStatusLabel(status: AdminStockStatus) {
  switch (status) {
    case "DISPONIBLE":
      return "Disponible";
    case "STOCK_BAJO":
      return "Stock bajo";
    case "AGOTADO":
      return "Agotada";
    case "BAJO_PEDIDO":
      return "Bajo pedido";
    default:
      return "Disponible";
  }
}
