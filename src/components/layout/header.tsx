"use client";

import { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingBag, User, Heart, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavLinks } from "./nav-links";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/shared/stores/cart-store";
import { SITE } from "@/shared/config/site";
import { useFavoritesStore } from "@/shared/stores/favorites-store";

export function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

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
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/productos?q=${encodeURIComponent(q)}` : "/productos");
    setQuery("");
    setIsSearchOpen(false);
    setIsMobileOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[var(--z-navbar)] transition-all duration-200",
          isScrolled
            ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-background border-b border-border",
        )}
      >
        <div className="container-page flex items-center justify-between h-16 md:h-[4.5rem]">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-display text-xl font-bold uppercase tracking-[0.12em] shrink-0"
            >
              {SITE.brand}
            </Link>

            <NavLinks className="hidden lg:flex" />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <span aria-hidden className="hidden h-6 w-px bg-border md:ml-2 md:mr-3" />

            <form
              role="search"
              onSubmit={submitSearch}
              className="hidden md:flex items-center relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar camisetas..."
                aria-label="Buscar camisetas"
                className="h-9 w-48 lg:w-56 rounded-md border border-input bg-background pl-9 pr-3 text-sm transition-all hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
              />
            </form>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" asChild aria-label="Cuenta">
              <Link href="/cuenta">
                <User className="h-5 w-5" />
              </Link>
            </Button>

            <FavoritesBadge />

            <Button variant="ghost" size="icon" asChild aria-label="Vistos recientemente"><Link href="/productos#vistos-recientemente"><History className="h-5 w-5" /></Link></Button>

            <CartBadge />

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="md:hidden container-page pb-3">
            <form role="search" onSubmit={submitSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar camisetas..."
                aria-label="Buscar camisetas"
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
                autoFocus
              />
            </form>
          </div>
        )}
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[var(--z-drawer)] bg-black/40 lg:hidden",
          "transition-opacity duration-200",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-[var(--z-drawer)] w-72 bg-card border-r border-border",
          "flex flex-col p-6 transition-transform duration-200 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="font-display text-xl font-bold uppercase tracking-[0.12em]"
            onClick={() => setIsMobileOpen(false)}
          >
            {SITE.brand}
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

function FavoritesBadge() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const hydrate = useFavoritesStore((state) => state.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return <Link href="/favoritos" className="relative"><Button variant="ghost" size="icon" aria-label={`Favoritos${favorites.length ? `, ${favorites.length} guardados` : ""}`}><Heart className="h-5 w-5" />{favorites.length > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{favorites.length > 99 ? "99+" : favorites.length}</span>}</Button></Link>;
}