"use client";

import { useActionState } from "react";
import { SHIPPING } from "@/shared/config/site";
import { updateShippingRatesAction } from "@/features/system/server/shipping-rates-actions";
import type { AdminSaveResult } from "@/shared/admin/admin-save-result";
import type { ShippingRates } from "@/features/checkout/shipping";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function ShippingRatesForm({ initial }: { initial: ShippingRates }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: AdminSaveResult | null, formData: FormData) => updateShippingRatesAction(null, formData),
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nationalFeeCop" className="mb-1 block text-sm font-medium">
            Envío nacional (COP)
          </label>
          <input
            id="nationalFeeCop"
            name="nationalFeeCop"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initial.nationalFeeCop}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Se cobra en pedidos a Colombia por debajo de {money.format(SHIPPING.freeThreshold)}. Desde ese monto el envío nacional es gratis.
          </p>
        </div>
        <div>
          <label htmlFor="internationalFeeCop" className="mb-1 block text-sm font-medium">
            Envío internacional (COP)
          </label>
          <input
            id="internationalFeeCop"
            name="internationalFeeCop"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initial.internationalFeeCop}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Se cobra en cualquier país distinto de Colombia. PayPal lo convierte a dólares. Cero lo deja gratis.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar envíos"}
        </button>
        {state && (
          <p className={`text-sm ${state.ok ? "text-green-600" : "text-destructive"}`}>
            {state.ok ? "Envíos guardados." : state.error}
          </p>
        )}
      </div>
    </form>
  );
}
