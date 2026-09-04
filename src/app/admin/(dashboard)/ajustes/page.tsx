import type { Metadata } from "next";
import { getPublicUsdRate } from "@/features/system/repositories/usd-rate-repository";
import { UsdRateForm } from "@/features/system/components/usd-rate-form";

export const metadata: Metadata = {
  title: "Ajustes · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const rate = await getPublicUsdRate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Ajustes
        </h2>
        <p className="text-sm text-muted-foreground">
          Configuración general de la tienda.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Tasa de conversión USD
        </h3>
        <UsdRateForm
          initialCopPerUsd={rate.available ? rate.copPerUsd : 4000}
          initialEnabled={rate.available}
        />
      </div>
    </div>
  );
}
