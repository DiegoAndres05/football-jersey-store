"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SaleCurrency } from "@/shared/currency/sale-currency";
import { SALE_CURRENCY_COOKIE } from "@/shared/currency/sale-currency";

interface CurrencySelectorProps {
  current: SaleCurrency;
  rateInfo?: { copPerUsd: number; updatedAt: string } | null;
}

const SWITCH_LABEL: Record<SaleCurrency, string> = {
  COP: "Cambiando a pesos…",
  USD: "Cambiando a dólares…",
};

export function CurrencySelector({ current, rateInfo }: CurrencySelectorProps) {
  const router = useRouter();
  const usdAvailable = Boolean(rateInfo && rateInfo.copPerUsd >= 1);
  const [switchingTo, setSwitchingTo] = useState<SaleCurrency | null>(null);

  useEffect(() => {
    setSwitchingTo(null);
  }, [current]);

  const handleChange = useCallback(
    (value: SaleCurrency) => {
      if (value === current || switchingTo) return;
      if (value === "USD" && !usdAvailable) return;
      setSwitchingTo(value);
      document.cookie = `${SALE_CURRENCY_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    },
    [current, router, switchingTo, usdAvailable],
  );

  return (
    <div className="flex items-center">
      {switchingTo && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-xs rounded-2xl border border-border bg-card px-6 py-6 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
            <p className="text-sm font-medium">{SWITCH_LABEL[switchingTo]}</p>
            <p className="mt-1 text-xs text-muted-foreground">Espera un momento, estamos actualizando los precios.</p>
          </div>
        </div>
      )}
      <div className="flex rounded-lg border border-border overflow-hidden" aria-busy={switchingTo !== null}>
        <button
          type="button"
          onClick={() => handleChange("COP")}
          disabled={switchingTo !== null}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            current === "COP"
              ? "bg-foreground text-background"
              : "bg-background text-muted-foreground hover:text-foreground"
          } disabled:cursor-wait disabled:opacity-70`}
        >
          COP
        </button>
        <button
          type="button"
          onClick={() => handleChange("USD")}
          disabled={!usdAvailable || switchingTo !== null}
          aria-disabled={!usdAvailable}
          title={usdAvailable ? "Ver precios en dólares" : "Los dólares no están disponibles"}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            current === "USD"
              ? "bg-foreground text-background"
              : "bg-background text-muted-foreground hover:text-foreground"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          USD
        </button>
      </div>
      {!usdAvailable && (
        <span className="sr-only">Los dólares no están disponibles</span>
      )}
    </div>
  );
}
