export const ADMIN_ORDER_FILTER_VALUES = ["INMEDIATA", "BAJO_PEDIDO"] as const;
export type AdminOrderFilterValue = (typeof ADMIN_ORDER_FILTER_VALUES)[number] | "TODOS";

export function normalizeAdminOrderFilter(value: string | null | undefined): AdminOrderFilterValue {
  if (value === "INMEDIATA" || value === "BAJO_PEDIDO") {
    return value;
  }
  return "TODOS";
}

export function buildAdminOrderFilterHref(value: AdminOrderFilterValue) {
  if (value === "TODOS") {
    return "/admin/pedidos";
  }
  return `/admin/pedidos?modalidad=${value}`;
}
