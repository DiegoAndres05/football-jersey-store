"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/shared/stores/cart-store";
import { CartIcon } from "@/components/ui/cart-icon";
import { shouldShowMobileCartFab } from "@/features/cart/domain/mobile-cart-fab";

export function MobileCartFab({ isMobileMenuOpen }: { isMobileMenuOpen: boolean }) {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persist = useCartStore.persist;
    if (!persist?.hasHydrated()) {
      if (!persist) {
        setHydrated(true);
        return;
      }
      return persist.onFinishHydration(() => setHydrated(true));
    }
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const visible = shouldShowMobileCartFab({
    itemCount,
    pathname,
    isCompactNav: true,
    isMobileMenuOpen,
  });
  if (!visible) return null;

  const badge = itemCount > 99 ? "99+" : String(itemCount);
  const noun = itemCount === 1 ? "artículo" : "artículos";

  return (
    <Link
      href="/carrito"
      aria-label={`Carrito, ${itemCount} ${noun}`}
      className="lg:hidden fixed right-4 z-[var(--z-navbar)] bottom-[max(1rem,env(safe-area-inset-bottom))] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
    >
      <CartIcon className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[10px] font-bold text-foreground">
        {badge}
      </span>
    </Link>
  );
}
