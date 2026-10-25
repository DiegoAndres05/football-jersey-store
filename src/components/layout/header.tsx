"use client";

import { Suspense, useEffect, useState } from "react";
import { Menu, X, Search, User, Heart, History } from "lucide-react";
import { CartIcon } from "@/components/ui/cart-icon";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavLinks } from "./nav-links";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCartStore } from "@/shared/stores/cart-store";
import { SITE } from "@/shared/config/site";
import { useFavoritesStore } from "@/shared/stores/favorites-store";
import { MobileCartFab } from "@/features/cart/components/mobile-cart-fab";

function SearchQuerySync({ onQuery }: { onQuery: (value: string) => void }) {
  const query = useSearchParams().get("q") ?? "";
  useEffect(() => {
    onQuery(query);
  }, [onQuery, query]);
  return null;
}

export function Header({
  currencySlot,
}: {
  currencySlot?: React.ReactNode;
}) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileOpen(false);
      } else {
        setIsDesktopMenuOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setIsMobileOpen(false);
    } else {
      setIsDesktopMenuOpen(false);
    }

    mediaQuery.addEventListener("change", handleBreakpointChange);
    return () => mediaQuery.removeEventListener("change", handleBreakpointChange);
  }, []);

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/productos?q=${encodeURIComponent(q)}` : "/productos");
    setQuery(q);
    if (!q) setIsSearchOpen(false);
    setIsMobileOpen(false);
  };

  return (
    <>
      <Suspense fallback={null}>
        <SearchQuerySync onQuery={setQuery} />
      </Suspense>
      <header
        className={cn(
          "fixed top-0 inset-x-0 w-full z-[var(--z-navbar)] transition-all duration-200",
          isScrolled
            ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-background border-b border-border",
        )}
      >
        <div className="container-page relative flex h-16 items-center md:h-[4.5rem] lg:grid lg:grid-cols-[max-content_minmax(0,1fr)_auto] lg:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 lg:hidden"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Menú"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link
            href="/"
            aria-label={SITE.brand}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 lg:static lg:z-auto lg:translate-x-0 lg:translate-y-0"
          >
            <picture>
              <source media="(min-width: 1024px)" srcSet="/flashsport-logo-halloween.png" />
              <img
                src="/flashsport-mark.png"
                alt=""
                className="h-10 w-auto lg:-ml-3 lg:h-9 lg:w-[13.5rem] lg:translate-y-1 lg:object-contain lg:object-left"
              />
            </picture>
          </Link>

          <div className="hidden min-w-0 lg:block">
            <NavLinks className="hidden justify-center lg:flex" />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            {currencySlot && (
              <div className="hidden border-l border-border pl-3 sm:ml-3 sm:block xl:ml-4 xl:pl-4">{currencySlot}</div>
            )}

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
                className="h-9 w-36 rounded-md border border-input bg-background pl-9 pr-3 text-sm transition-all hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground lg:w-40 xl:w-56"
              />
            </form>

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" asChild aria-label="Cuenta" className="hidden h-11 w-11 md:inline-flex">
              <Link href="/cuenta">
                <User className="h-5 w-5" />
              </Link>
            </Button>

            {/* <div className="hidden xl:block">
              <FavoritesBadge />
            </div> */}

            {/* <Button variant="ghost" size="icon" asChild aria-label="Vistos recientemente" className="hidden xl:inline-flex"><Link href="/productos#vistos-recientemente"><History className="h-5 w-5" /></Link></Button> */}

            <CartBadge />

            <Popover open={isDesktopMenuOpen} onOpenChange={setIsDesktopMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:inline-flex"
                  aria-label={isDesktopMenuOpen ? "Cerrar menú" : "Abrir menú"}
                  aria-expanded={isDesktopMenuOpen}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <nav aria-label="Accesos rápidos" className="space-y-1">
                  <Link
                    href="/favoritos"
                    onClick={() => setIsDesktopMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Heart className="h-4 w-4" aria-hidden="true" />
                    Favoritos
                  </Link>
                  <Link
                    href="/productos#vistos-recientemente"
                    onClick={() => setIsDesktopMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <History className="h-4 w-4" aria-hidden="true" />
                    Vistos recientemente
                  </Link>
                </nav>
              </PopoverContent>
            </Popover>

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
      <div aria-hidden="true" className="h-16 md:h-[4.5rem]" />

      <MobileCartFab isMobileMenuOpen={isMobileOpen} />

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
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setIsMobileOpen(false)} aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <NavLinks mobile onNavClick={() => setIsMobileOpen(false)} />

        <div className="mt-4 pt-4 border-t border-border space-y-1">
          <div className="px-4 py-2">
            {currencySlot}
          </div>
          <Link
            href="/favoritos"
            onClick={() => setIsMobileOpen(false)}
            className="flex min-h-11 items-center gap-3 px-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Heart className="h-4 w-4" />
            Favoritos
          </Link>
          <Link
            href="/productos#vistos-recientemente"
            onClick={() => setIsMobileOpen(false)}
            className="flex min-h-11 items-center gap-3 px-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-4 w-4" />
            Vistos recientemente
          </Link>
          <Link
            href="/cuenta"
            onClick={() => setIsMobileOpen(false)}
            className="flex min-h-11 items-center gap-3 px-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors md:hidden"
          >
            <User className="h-4 w-4" />
            Mi cuenta
          </Link>
        </div>
      </div>
    </>
  );
}

function CartBadge() {
  const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  return (
    <Button variant="ghost" size="icon" aria-label="Carrito" className="relative h-11 w-11" asChild>
      <Link href="/carrito">
        <CartIcon className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

function FavoritesBadge() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const hydrate = useFavoritesStore((state) => state.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return <Link href="/favoritos" className="relative"><Button variant="ghost" size="icon" aria-label={`Favoritos${favorites.length ? `, ${favorites.length} guardados` : ""}`}><Heart className="h-5 w-5" />{favorites.length > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{favorites.length > 99 ? "99+" : favorites.length}</span>}</Button></Link>;
}