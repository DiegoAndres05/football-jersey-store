"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/shared/stores/cart-store";
import { toast } from "@/components/ui/toast";
import type { DeliveryMode } from "@/features/products/types/delivery-mode";

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
  disabled?: boolean;
}) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleClick = useCallback(() => {
    if (disabled) return;

    addItem({
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
    });

    setAdded(true);
    toast({ title: "Agregado al carrito", variant: "success" });

    setTimeout(() => setAdded(false), 2000);
  }, [variantId, productSlug, productName, teamName, versionName, sizeName, imageUrl, unitPrice, customizationType, customizationName, customizationNumber, deliveryMode, disabled, addItem]);

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
