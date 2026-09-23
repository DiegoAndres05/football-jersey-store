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
  const items = NAV_ITEMS;

  return (
    <nav
      className={cn(
        "flex",
        mobile ? "flex-col gap-1" : "items-center gap-4 whitespace-nowrap xl:gap-6",
        className,
      )}
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              mobile
                ? cn(
                    "whitespace-nowrap border-l-2 py-2.5 pl-4 text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
                    isActive
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )
                : cn(
                    "whitespace-nowrap border-b-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors xl:text-[13px] xl:tracking-[0.12em]",
                    isActive
                      ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  ),
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}