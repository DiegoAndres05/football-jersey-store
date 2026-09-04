"use client";

import { useActionState } from "react";
import { updateUsdRateAction } from "@/features/system/server/usd-rate-actions";
import type { AdminSaveResult } from "@/shared/admin/admin-save-result";

interface UsdRateFormProps {
  initialCopPerUsd: number;
  initialEnabled: boolean;
}

export function UsdRateForm({ initialCopPerUsd, initialEnabled }: UsdRateFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: AdminSaveResult | null, formData: FormData) => {
      return updateUsdRateAction(null, formData);
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1">
          <label htmlFor="copPerUsd" className="block text-sm font-medium mb-1">
            COP por 1 USD
          </label>
          <input
            id="copPerUsd"
            name="copPerUsd"
            type="number"
            min={1}
            required
            defaultValue={initialCopPerUsd}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Ej: 4000"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Cuántos pesos colombianos equivalen a 1 dólar.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="enabled"
            name="enabled"
            type="checkbox"
            defaultChecked={initialEnabled}
            className="h-4 w-4 accent-primary"
          />
          <label htmlFor="enabled" className="text-sm font-medium">
            USD habilitado
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar tasa"}
        </button>

        {state && (
          <p
            className={`text-sm ${
              state.ok ? "text-green-600" : "text-destructive"
            }`}
          >
            {state.ok ? "Tasa guardada exitosamente." : state.error}
          </p>
        )}
      </div>
    </form>
  );
}
