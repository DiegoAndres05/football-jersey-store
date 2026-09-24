"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { adminFocusRing } from "../admin-ui-formatters";
import type { AdminOrderDateFilter } from "./admin-order-filters";

const filters = [
  ["TODOS", "Todos"],
  ["INMEDIATA", "Entrega inmediata"],
  ["BAJO_PEDIDO", "Bajo pedido"],
] as const;

export function OrderListControls({ active, dateFilter }: { active: (typeof filters)[number][0]; dateFilter: AdminOrderDateFilter }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dateMode, setDateMode] = useState<"day" | "month" | "range" | "">(
    dateFilter.day ? "day" : dateFilter.month ? "month" : dateFilter.fromValue || dateFilter.toValue ? "range" : "",
  );
  const buildModeHref = (value: (typeof filters)[number][0]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "TODOS") params.delete("modalidad");
    else params.set("modalidad", value);
    return `${pathname}${params.size ? `?${params}` : ""}`;
  };
  const clearDatesHref = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("fecha");
    params.delete("mes");
    params.delete("desde");
    params.delete("hasta");
    return `${pathname}${params.size ? `?${params}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <nav aria-label="Filtrar pedidos" className="flex flex-wrap gap-2 text-sm">
      {filters.map(([value, label]) => {
        return (
          <Link key={value} href={buildModeHref(value)} aria-current={active === value ? "page" : undefined}
            className={`${adminFocusRing} rounded-md border px-3 py-1.5 ${active === value ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-muted-foreground/40"}`}>
            {label}
          </Link>
        );
      })}
      </nav>
      <form action={pathname} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <div className="space-y-1">
          <label htmlFor="order-date-mode" className="block text-xs font-medium text-muted-foreground">Filtrar fecha por</label>
          <select
            id="order-date-mode"
            value={dateMode}
            onChange={(event) => setDateMode(event.target.value as typeof dateMode)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Sin filtro de fecha</option>
            <option value="day">Día específico</option>
            <option value="month">Mes completo</option>
            <option value="range">Rango de fechas</option>
          </select>
        </div>
        {dateMode === "day" && (
          <div className="space-y-1">
            <label htmlFor="order-day" className="block text-xs font-medium text-muted-foreground">Día</label>
            <input id="order-day" name="fecha" type="date" defaultValue={dateFilter.day ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
          </div>
        )}
        {dateMode === "month" && (
          <div className="space-y-1">
            <label htmlFor="order-month" className="block text-xs font-medium text-muted-foreground">Mes</label>
            <input id="order-month" name="mes" type="month" defaultValue={dateFilter.month ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
          </div>
        )}
        {dateMode === "range" && (
          <>
            <div className="space-y-1">
              <label htmlFor="order-from" className="block text-xs font-medium text-muted-foreground">Desde</label>
              <input id="order-from" name="desde" type="date" defaultValue={dateFilter.fromValue} className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="order-to" className="block text-xs font-medium text-muted-foreground">Hasta</label>
              <input id="order-to" name="hasta" type="date" defaultValue={dateFilter.toValue} className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
            </div>
          </>
        )}
        <input type="hidden" name="modalidad" value={active === "TODOS" ? "" : active} />
        <button type="submit" className={`${adminFocusRing} h-9 rounded-md bg-foreground px-3 text-sm font-medium text-background`}>Filtrar fechas</button>
        <Link href={clearDatesHref()} className={`${adminFocusRing} h-9 rounded-md border border-border px-3 py-1.5 text-sm`}>Limpiar fechas</Link>
      </form>
    </div>
  );
}
