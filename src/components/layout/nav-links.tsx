"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Tienda" },
  { href: "/sobre-nosotros", label: "Nosotros" },
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
        mobile ? "flex-col gap-1" : "items-center gap-7 whitespace-nowrap",
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
                    "flex min-h-11 items-center whitespace-nowrap border-l-2 pl-4 text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
                    isActive
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )
                : cn(
                    "whitespace-nowrap py-1 text-[15px] font-medium text-[#2c2c2c] transition-colors hover:text-black",
                    isActive && "font-bold text-black underline decoration-2 underline-offset-[7px]",
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