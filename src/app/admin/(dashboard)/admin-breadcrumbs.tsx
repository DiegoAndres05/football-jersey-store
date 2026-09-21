"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import type { AdminBreadcrumbItem } from "./admin-ui-types";

export function AdminBreadcrumbs({ pathname: providedPathname }: { pathname?: string } = {}) {
  const currentPathname = usePathname();
  const pathname = providedPathname ?? currentPathname;
  const segments = pathname.split("/").filter(Boolean);
  const items: AdminBreadcrumbItem[] = [{ label: "Panel", href: "/admin" }];

  if (segments.length > 1) {
    const pathMap = ["/admin"];
    for (let index = 1; index < segments.length; index += 1) {
      const current = segments.slice(0, index + 1).join("/");
      pathMap.push(`/${current}`);
    }

    const labels: Record<string, string> = {
      "/admin/pedidos": "Pedidos",
      "/admin/productos": "Productos",
      "/admin/inventario": "Inventario",
      "/admin/cupones": "Cupones",
      "/admin/ligas": "Ligas",
      "/admin/equipos": "Equipos",
      "/admin/proveedores": "Proveedores",
      "/admin/temporadas": "Temporadas",
      "/admin/tallas": "Tallas",
      "/admin/versiones": "Versiones",
      "/admin/importar": "Importar",
      "/admin/ajustes": "Ajustes",
    };

    for (const path of pathMap.slice(1)) {
      const label = labels[path] ?? path.split("/").at(-1)?.replace(/[-_]/g, " ");
      if (label) {
        items.push({ label: label.charAt(0).toUpperCase() + label.slice(1), href: path });
      }
    }
  }

  const last = items[items.length - 1];
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
          {item.href && index < items.length - 1 ? (
            <Link href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span aria-current={last.label === item.label ? "page" : undefined} className={last.label === item.label ? "font-medium text-foreground" : ""}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
