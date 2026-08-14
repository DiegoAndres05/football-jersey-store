"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction, type ManagedOrderStatus } from "@/features/orders/server/order-actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagado",
  VALIDATING: "En validación",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ManagedOrderStatus;
    setError("");
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, next);
      if (!result.ok) {
        setError(result.error);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-1 min-w-36">
      <select
        aria-label="Cambiar estado del pedido"
        value={status}
        onChange={onChange}
        disabled={isPending}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}