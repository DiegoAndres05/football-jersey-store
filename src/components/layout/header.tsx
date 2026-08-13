"use client";

import { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NavLinks } from "./nav-links";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/shared/stores/cart-store";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[var(--z-navbar)] transition-all duration-200",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-background",
        )}
      >
        <div className="container-page flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg shrink-0">
              <span className="text-primary">⚽</span>
              <span className="hidden sm:inline">Football Jersey Store</span>
              <span className="sm:hidden">FJS</span>
            </Link>

            <NavLinks className="hidden md:flex" />
          </div>

          <div className="flex items-center gap-2">
            <div className={cn("hidden sm:flex items-center", isSearchOpen ? "flex" : "hidden lg:flex")}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  placeholder="Buscar camisetas..."
                  className="h-9 w-56 rounded-xl border border-input bg-background pl-9 pr-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </Button>

            <CartBadge />

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="sm:hidden container-page pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar camisetas..."
                className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[var(--z-drawer)] bg-black/40 md:hidden",
          "transition-opacity duration-200",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-[var(--z-drawer)] w-72 bg-card border-r border-border",
          "flex flex-col p-6 transition-transform duration-200 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-semibold text-lg" onClick={() => setIsMobileOpen(false)}>
            ⚽ FJS
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <NavLinks mobile onNavClick={() => setIsMobileOpen(false)} />
      </div>
    </>
  );
}

function CartBadge() {
  const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  return (
    <Link href="/carrito" className="relative">
      <Button variant="ghost" size="icon" aria-label="Carrito">
        <ShoppingBag className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>
    </Link>
  );
}
