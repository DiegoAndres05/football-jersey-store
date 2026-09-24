"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { CartIcon } from "@/components/ui/cart-icon";
import { useCartStore } from "@/shared/stores/cart-store";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
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
  baseUnitPriceCop,
  personalizationSurchargeCop,
  customizationType,
  customizationName,
  customizationNumber,
  deliveryMode,
  immediateStock,
  remainingImmediate: remainingImmediateUnits,
  lineKind = "JERSEY",
  disabled,
  sizeRequired = false,
  onMissingSize,
  className,
}: {
  variantId: string;
  productSlug: string;
  productName: string;
  teamName: string;
  versionName: string;
  sizeName: string;
  imageUrl: string;
  unitPrice: number;
  baseUnitPriceCop?: number;
  personalizationSurchargeCop?: number;
  customizationType: "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";
  customizationName: string;
  customizationNumber: string;
  deliveryMode: DeliveryMode;
  immediateStock?: number;
  remainingImmediate?: number;
  lineKind?: "JERSEY" | "MYSTERY_BOX";
  disabled?: boolean;
  sizeRequired?: boolean;
  onMissingSize?: () => void;
  className?: string;
}) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleClick = useCallback(() => {
    if (sizeRequired) {
      onMissingSize?.();
      return;
    }

    if (disabled) return;

    if (deliveryMode === "INMEDIATA" && remainingImmediateUnits !== undefined && remainingImmediateUnits <= 0) {
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
        baseUnitPriceCop: baseUnitPriceCop ?? unitPrice,
        personalizationSurchargeCop,
        customizationType,
        customizationName,
        customizationNumber,
        deliveryMode,
        lineKind,
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
  }, [variantId, productSlug, productName, teamName, versionName, sizeName, imageUrl, unitPrice, baseUnitPriceCop, personalizationSurchargeCop, customizationType, customizationName, customizationNumber, deliveryMode, immediateStock, remainingImmediateUnits, lineKind, disabled, sizeRequired, onMissingSize, addItem]);

  return (
    <Button
      size="xl"
      className={cn("w-full whitespace-nowrap", className)}
      disabled={disabled}
      onClick={handleClick}
      icon={added ? <Check className="h-5 w-5" /> : <CartIcon className="h-5 w-5" />}
    >
      {added ? "Agregado" : "Agregar al carrito"}
    </Button>
  );
}
