export type MobileCartFabInput = {
  itemCount: number;
  pathname: string;
  isCompactNav: boolean;
  isMobileMenuOpen: boolean;
};

export function shouldShowMobileCartFab({
  itemCount,
  pathname,
  isCompactNav,
  isMobileMenuOpen,
}: MobileCartFabInput): boolean {
  if (itemCount < 1 || !isCompactNav || isMobileMenuOpen) return false;
  if (pathname === "/carrito" || pathname === "/checkout" || pathname.startsWith("/checkout/")) {
    return false;
  }
  return true;
}
