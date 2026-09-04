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

  const handleChange = useCallback(
    (value: SaleCurrency) => {
      document.cookie = `${SALE_CURRENCY_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    },
    [router],
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
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            current === "USD"
              ? "bg-foreground text-background"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          USD
        </button>
      </div>
    </div>
  );
}
