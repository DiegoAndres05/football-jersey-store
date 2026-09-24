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

function isDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isMonth(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

export type AdminOrderDateFilter = {
  from?: Date;
  to?: Date;
  day?: string;
  month?: string;
  fromValue: string;
  toValue: string;
};

export function normalizeAdminOrderDateFilter(params: {
  fecha?: string;
  mes?: string;
  desde?: string;
  hasta?: string;
}): AdminOrderDateFilter {
  if (isDate(params.fecha)) {
    const from = new Date(`${params.fecha}T00:00:00.000Z`);
    const to = new Date(`${params.fecha}T23:59:59.999Z`);
    return { from, to, day: params.fecha, fromValue: params.fecha, toValue: params.fecha };
  }

  if (isMonth(params.mes)) {
    const [year, month] = params.mes.split("-").map(Number);
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { from, to, month: params.mes, fromValue: "", toValue: "" };
  }

  const from = isDate(params.desde) ? new Date(`${params.desde}T00:00:00.000Z`) : undefined;
  const to = isDate(params.hasta) ? new Date(`${params.hasta}T23:59:59.999Z`) : undefined;
  return { from, to, fromValue: params.desde ?? "", toValue: params.hasta ?? "" };
}
