"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { AdminNavItem } from "./admin-ui-types";

export function AdminNavigation({
  items,
  userEmail,
}: {
  items: AdminNavItem[];
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string, exact = false) => {
    if (href === "/admin") {
      return exact ? pathname === "/admin" : pathname === "/admin" || pathname.startsWith("/admin/");
    }
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm font-medium md:hidden"
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        aria-label="Abrir navegación del panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span>Secciones</span>
        {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
      </button>

      <nav
        id="admin-mobile-nav"
        aria-label="Navegación de administración"
        className={`${open ? "block" : "hidden"} md:hidden`}
      >
        <ul className="mt-3 grid gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
          {items.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="Navegación principal" className="hidden md:block">
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-secondary text-foreground ring-1 ring-border" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="truncate">{userEmail}</span>
      </div>
    </>
  );
}
