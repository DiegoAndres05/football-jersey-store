"use client";

import { useEffect } from "react";
import { forgetPaymentRecovery, readRecoveredCartItems } from "@/features/payments/recovery";
import { useCartStore } from "@/shared/stores/cart-store";

export function RecoverCartUnlessPaid({ paid }: { paid: boolean }) {
  useEffect(() => {
    const sync = () => {
      if (paid) {
        useCartStore.getState().clear();
        forgetPaymentRecovery();
        return;
      }
      if (useCartStore.getState().items.length > 0) return;
      const recovered = readRecoveredCartItems();
      if (recovered.length > 0) useCartStore.getState().replaceItems(recovered);
    };
    const persist = useCartStore.persist;
    const unsubscribe = persist?.hasHydrated() ? undefined : persist?.onFinishHydration(sync);
    if (!persist || persist.hasHydrated()) sync();
    return () => unsubscribe?.();
  }, [paid]);

  return null;
}
