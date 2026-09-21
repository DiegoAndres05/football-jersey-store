"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { adminFocusRing } from "../admin-ui-formatters";

const filters = [
  ["TODOS", "Todos"],
  ["INMEDIATA", "Entrega inmediata"],
  ["BAJO_PEDIDO", "Bajo pedido"],
] as const;

export function OrderListControls({ active }: { active: (typeof filters)[number][0] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <nav aria-label="Filtrar pedidos" className="flex flex-wrap gap-2 text-sm">
      {filters.map(([value, label]) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "TODOS") params.delete("modalidad");
        else params.set("modalidad", value);
        return (
          <Link key={value} href={`${pathname}${params.size ? `?${params}` : ""}`} aria-current={active === value ? "page" : undefined}
            className={`${adminFocusRing} rounded-md border px-3 py-1.5 ${active === value ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-muted-foreground/40"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
