import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryMode } from "@/features/products/types/delivery-mode";
import {
  maxImmediateForLine,
  reconcileImmediateCart,
  remainingImmediate,
  type CartAdjustment,
} from "@/features/cart/domain/immediate-quantity";

export type CustomizationType = "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";

export type CartItem = {
  lineId: string;
  variantId: string;
  productSlug: string;
  productName: string;
  teamName: string;
  versionName: string;
  sizeName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  customizationType: CustomizationType;
  customizationName: string;
  customizationNumber: string;
  deliveryMode: DeliveryMode;
};

export type CartDraft = Omit<CartItem, "quantity" | "lineId">;

export type CartMutationResult = { ok: true } | { ok: false; reason: "at_cap" };

/**
 * Una línea de carrito se identifica por variante + personalización + modalidad
 * de entrega: la misma variante en "inmediata" y en "bajo pedido" son líneas
 * distintas porque difieren en stock, tiempo de despacho y validación.
 */
export function buildLineId(
  item: Pick<
    CartItem,
    "variantId" | "customizationType" | "customizationName" | "customizationNumber" | "deliveryMode"
  >,
): string {
  const customization =
    item.customizationType === "NONE"
      ? "none"
      : `${item.customizationType}:${item.customizationName}:${item.customizationNumber}`;
  return `${item.variantId}#${customization}#${item.deliveryMode}`;
}

type LegacyCartItem = Omit<CartItem, "lineId" | "deliveryMode">;

interface CartState {
  items: CartItem[];
  addItem: (draft: CartDraft, immediateStock?: number) => CartMutationResult;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number, immediateStock?: number) => CartMutationResult;
  reconcileWithStock: (stockByVariantId: ReadonlyMap<string, number>) => CartAdjustment[];
  clear: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (draft, immediateStock) => {
        if (draft.deliveryMode === "INMEDIATA" && typeof immediateStock === "number") {
          if (remainingImmediate(get().items, draft.variantId, immediateStock) <= 0) {
            return { ok: false, reason: "at_cap" };
          }
        }
        const lineId = buildLineId(draft);
        set((s) => {
          const existing = s.items.find((i) => i.lineId === lineId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.lineId === lineId ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return { items: [...s.items, { ...draft, lineId, quantity: 1 }] };
        });
        return { ok: true };
      },
      removeItem: (lineId) => {
        set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) }));
      },
      updateQuantity: (lineId, quantity, immediateStock) => {
        if (quantity < 1) return { ok: false, reason: "at_cap" };
        const items = get().items;
        const line = items.find((i) => i.lineId === lineId);
        if (line?.deliveryMode === "INMEDIATA" && typeof immediateStock === "number") {
          if (quantity > maxImmediateForLine(items, lineId, immediateStock)) {
            return { ok: false, reason: "at_cap" };
          }
        }
        set({
          items: items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
        });
        return { ok: true };
      },
      reconcileWithStock: (stockByVariantId) => {
        const { items, adjustments } = reconcileImmediateCart(get().items, stockByVariantId);
        if (adjustments.length > 0) set({ items });
        return adjustments;
      },
      clear: () => set({ items: [] }),
      itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () => get().items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),
    }),
    {
      name: "fjs-cart",
      version: 3,
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted) => {
        const state = persisted as { items?: LegacyCartItem[] };
        return {
          items: (state.items ?? []).map((item) => {
            const normalized = { ...item, deliveryMode: "INMEDIATA" as const };
            return { ...normalized, lineId: buildLineId(normalized) };
          }),
        };
      },
    },
  ),
);
