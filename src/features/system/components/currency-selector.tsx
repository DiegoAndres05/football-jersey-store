"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { SaleCurrency } from "@/shared/currency/sale-currency";
import { SALE_CURRENCY_COOKIE } from "@/shared/currency/sale-currency";

interface CurrencySelectorProps {
  current: SaleCurrency;
  rateInfo?: { copPerUsd: number; updatedAt: string } | null;
}

export function CurrencySelector({ current, rateInfo }: CurrencySelectorProps) {
  const router = useRouter();
  const usdAvailable = Boolean(rateInfo && rateInfo.copPerUsd >= 1);

  const handleChange = useCallback(
    (value: SaleCurrency) => {
      if (value === "USD" && !usdAvailable) return;
      document.cookie = `${SALE_CURRENCY_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    },
    [router, usdAvailable],
  );

  return (
    <div className="flex items-center">
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => handleChange("COP")}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            current === "COP"
              ? "bg-foreground text-background"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          COP
        </button>
        <button
          type="button"
          onClick={() => handleChange("USD")}
          disabled={!usdAvailable}
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
