import { isProductDetailPath, shouldShowPurchaseBar } from "@/features/products/domain/purchase-bar";

export type MobileCartFabInput = {
  itemCount: number;
  pathname: string;
  isCompactNav: boolean;
  isMobileMenuOpen: boolean;
  viewportWidth?: number | null;
};

const HIDDEN_PREFIXES = ["/carrito", "/checkout", "/pedido"];

export function shouldShowMobileCartFab({
  itemCount,
  pathname,
  isCompactNav,
  isMobileMenuOpen,
  viewportWidth,
}: MobileCartFabInput): boolean {
  if (itemCount < 1 || !isCompactNav || isMobileMenuOpen) return false;
  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  if (isProductDetailPath(pathname) && (viewportWidth == null || shouldShowPurchaseBar({ viewportWidth }))) {
    return false;
  }
  return true;
}
