"use client";

import { cn } from "@/lib/utils";
import { Package, Truck } from "lucide-react";
import {
  DELIVERY_MODE_INFO,
  type DeliveryMode,
} from "@/features/products/types/delivery-mode";

const ICONS: Record<DeliveryMode, typeof Truck> = {
  INMEDIATA: Truck,
  BAJO_PEDIDO: Package,
};

export function ProductDeliveryMode({
  stock,
  allowsBackorder,
  selected,
  onSelect,
}: {
  stock: number | null;
  allowsBackorder: boolean;
  selected: DeliveryMode;
  onSelect: (mode: DeliveryMode) => void;
}) {
  const hasStock = (stock ?? 0) > 0;
  const isLowStock = hasStock && (stock ?? 0) <= 2;

  const options: { mode: DeliveryMode; disabled: boolean; reason: string | null }[] = [
    {
      mode: "INMEDIATA",
      disabled: !hasStock,
      reason: !hasStock ? "Sin stock disponible" : null,
    },
    {
      mode: "BAJO_PEDIDO",
      disabled: !allowsBackorder,
      reason: !allowsBackorder ? "No disponible en esta talla" : null,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium block">Modalidad de entrega</label>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {options.map(({ mode, disabled, reason }) => {
          const info = DELIVERY_MODE_INFO[mode];
          const Icon = ICONS[mode];
          const isSelected = selected === mode && !disabled;

          return (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(mode)}
              className={cn(
                "rounded-xl border-2 p-3 text-left transition-all",
                "disabled:pointer-events-none",
                isSelected
                  ? "border-primary bg-primary/5"
                  : disabled
                    ? "border-border/50 opacity-60"
                    : "border-border hover:border-muted-foreground/40",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isSelected ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className={cn("text-sm font-medium", isSelected && "text-primary")}>
                  {info.label}
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">
                {reason ?? info.description}
                {!disabled && (
                  <span className="block">
                    {mode === "INMEDIATA" && isLowStock
                      ? `¡Solo ${stock} disponibles! Despacho en 24–48 horas.`
                      : info.eta}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}