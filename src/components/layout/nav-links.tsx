"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Tienda" },
  { href: "/ligas", label: "Ligas" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function NavLinks({
  className,
  mobile = false,
  onNavClick,
}: {
  className?: string;
  mobile?: boolean;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex", mobile ? "flex-col gap-1" : "items-center gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={cn(
              "rounded-sm px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}