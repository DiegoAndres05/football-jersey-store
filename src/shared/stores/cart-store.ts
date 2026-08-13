import { create } from "zustand";
import { persist } from "zustand/middleware";

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
};

export type CartDraft = Omit<CartItem, "quantity" | "lineId">;

/**
 * Una línea de carrito se identifica por variante + personalización:
 * "Real Madrid / Fan / M" (sin personalizar) es distinto de
 * "Real Madrid / Player / M", y dos personalizaciones distintas
 * sobre la misma variante nunca se mezclan.
 */
export function buildLineId(
  item: Pick<
    CartItem,
    "variantId" | "customizationType" | "customizationName" | "customizationNumber"
  >,
): string {
  const customization =
    item.customizationType === "NONE"
      ? "none"
      : `${item.customizationType}:${item.customizationName}:${item.customizationNumber}`;
  return `${item.variantId}#${customization}`;
}

type LegacyCartItem = Omit<CartItem, "lineId">;

interface CartState {
  items: CartItem[];
  addItem: (draft: CartDraft) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (draft) => {
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
      },
      removeItem: (lineId) => {
        set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) }));
      },
      updateQuantity: (lineId, quantity) => {
        if (quantity < 1) return;
        set((s) => ({
          items: s.items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
        }));
      },
      clear: () => set({ items: [] }),
      itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () => get().items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),
    }),
    {
      name: "fjs-cart",
      version: 2,
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted) => {
        const state = persisted as { items?: LegacyCartItem[] };
        return {
          items: (state.items ?? []).map((item) => ({
            ...item,
            lineId: buildLineId(item),
          })),
        };
      },
    },
  ),
);