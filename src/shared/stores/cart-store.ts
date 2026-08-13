import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  teamName: string;
  versionName: string;
  sizeName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  customizationType: "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";
  customizationName: string;
  customizationNumber: string;
};

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((s) => {
          const existing = s.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: 1 }] };
        });
      },
      removeItem: (variantId) => {
        set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) }));
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity < 1) return;
        set((s) => ({
          items: s.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        }));
      },
      clear: () => set({ items: [] }),
      itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () => get().items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),
    }),
    { name: "fjs-cart" },
  ),
);
