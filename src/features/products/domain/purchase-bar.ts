export const PURCHASE_BAR_MAX_WIDTH = 430;

export type PurchaseBarInput = {
  viewportWidth: number;
  isKeyboardOpen?: boolean;
  isDialogOpen?: boolean;
};

export function shouldShowPurchaseBar({ viewportWidth, isKeyboardOpen = false, isDialogOpen = false }: PurchaseBarInput): boolean {
  if (viewportWidth > PURCHASE_BAR_MAX_WIDTH) return false;
  return !isKeyboardOpen && !isDialogOpen;
}

export function isProductDetailPath(pathname: string): boolean {
  return /^\/productos\/[^/]+\/?$/.test(pathname);
}
