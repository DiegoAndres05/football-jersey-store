"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Catálogo" },
] as const;

export function NavLinks({ className, mobile = false, onNavClick }: { className?: string; mobile?: boolean; onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex", mobile ? "flex-col gap-1" : "items-center gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
