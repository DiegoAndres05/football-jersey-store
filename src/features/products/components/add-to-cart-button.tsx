"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/shared/stores/cart-store";
import { toast } from "@/components/ui/toast";
import type { DeliveryMode } from "@/features/products/types/delivery-mode";
import { IMMEDIATE_AT_CAP_MESSAGE } from "@/features/cart/domain/immediate-quantity";

export function AddToCartButton({
  variantId,
  productSlug,
  productName,
  teamName,
  versionName,
  sizeName,
  imageUrl,
  unitPrice,
  customizationType,
  customizationName,
  customizationNumber,
  deliveryMode,
  immediateStock,
  remainingImmediate: remainingImmediateUnits,
  disabled,
}: {
  variantId: string;
  productSlug: string;
  productName: string;
  teamName: string;
  versionName: string;
  sizeName: string;
  imageUrl: string;
  unitPrice: number;
  customizationType: "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";
  customizationName: string;
  customizationNumber: string;
  deliveryMode: DeliveryMode;
  immediateStock?: number;
  remainingImmediate?: number;
  disabled?: boolean;
}) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleClick = useCallback(() => {
    if (disabled) return;

    if (deliveryMode === "INMEDIATA" && (remainingImmediateUnits ?? 0) <= 0) {
      toast({ title: IMMEDIATE_AT_CAP_MESSAGE, variant: "warning" });
      return;
    }

    const result = addItem(
      {
        variantId,
        productSlug,
        productName,
        teamName,
        versionName,
        sizeName,
        imageUrl,
        unitPrice,
        customizationType,
        customizationName,
        customizationNumber,
        deliveryMode,
      },
      deliveryMode === "INMEDIATA" ? immediateStock : undefined,
    );

    if (!result.ok) {
      toast({ title: IMMEDIATE_AT_CAP_MESSAGE, variant: "warning" });
      return;
    }

    setAdded(true);
    toast({ title: "Agregado al carrito", variant: "success" });

    setTimeout(() => setAdded(false), 2000);
  }, [variantId, productSlug, productName, teamName, versionName, sizeName, imageUrl, unitPrice, customizationType, customizationName, customizationNumber, deliveryMode, immediateStock, remainingImmediateUnits, disabled, addItem]);

  return (
    <Button
      size="xl"
      className="w-full"
      disabled={disabled}
      onClick={handleClick}
      icon={added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
    >
      {added ? "Agregado" : "Agregar al carrito"}
    </Button>
  );
}
