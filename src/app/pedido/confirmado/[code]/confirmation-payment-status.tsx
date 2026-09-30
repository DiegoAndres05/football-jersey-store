"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { forgetPaymentRecovery } from "@/features/payments/recovery";

type ReconcileStatus = "PAID" | "REJECTED" | "PENDING" | "ERROR";

const MAX_AUTO_ATTEMPTS = 2;
const AUTO_RETRY_DELAY_MS = 5000;

/**
 * Asks the server to reconcile a pending order with Bold a couple of times
 * after the redirect, then leaves it to the shopper (manual retry), the
 * webhook, and the expiration job. It never renders a payment result itself:
 * when the server reports a final state, the page is refreshed and re-rendered
 * from the persisted Order status.
 *
 * Security: Never sends bold-tx-status or any client-provided payment status.
 * Only sends orderCode + optional boldOrderId for server-side lookup.
 */
export function ConfirmationPaymentStatus({
  orderCode,
  boldOrderId,
}: {
  orderCode: string;
  boldOrderId?: string | null;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callReconcile = useCallback(async (): Promise<ReconcileStatus> => {
    try {
      const res = await fetch("/api/bold/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, boldOrderId }),
      });
      if (!res.ok) return "ERROR";
      const data = await res.json();
      return (data.status as ReconcileStatus) ?? "PENDING";
    } catch {
      return "ERROR";
    }
  }, [orderCode, boldOrderId]);

  const reconcileOnce = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    const status = await callReconcile();
    inFlightRef.current = false;
    if (!mountedRef.current) return false;
    if (status === "PAID" || status === "REJECTED") {
      if (status === "PAID") forgetPaymentRecovery();
      router.refresh();
      return true;
    }
    return false;
  }, [callReconcile, router]);

  useEffect(() => {
    mountedRef.current = true;
    let attempt = 0;
    const run = async () => {
      attempt += 1;
      const settled = await reconcileOnce();
      if (!mountedRef.current || settled) return;
      if (attempt < MAX_AUTO_ATTEMPTS) {
        timerRef.current = setTimeout(run, AUTO_RETRY_DELAY_MS);
      } else {
        setChecking(false);
      }
    };
    void run();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reconcileOnce]);

  const handleManualRetry = async () => {
    setChecking(true);
    const settled = await reconcileOnce();
    if (mountedRef.current && !settled) setChecking(false);
  };

  if (checking) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
        Verificando con Bold…
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-muted-foreground">
        Bold aún no reporta el resultado. Puedes seguir navegando; tu pedido se
        actualizará en cuanto se confirme y te avisaremos por correo.
      </p>
      <button
        type="button"
        onClick={handleManualRetry}
        className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <RotateCcw className="h-3 w-3" />
        Verificar de nuevo
      </button>
    </div>
  );
}
