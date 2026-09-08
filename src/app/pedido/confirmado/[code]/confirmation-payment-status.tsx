"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

type ReconcileStatus = "PAID" | "REJECTED" | "PENDING" | "ERROR";

/**
 * Client component that calls POST /api/bold/reconcile to verify payment
 * status with the Bold API. Uses bounded polling for PENDING states.
 *
 * Security: Never sends bold-tx-status or any client-provided payment status.
 * Only sends orderCode + optional boldOrderId for server-side lookup.
 */
export function ConfirmationPaymentStatus({
  initialMode,
  orderCode,
  boldOrderId,
}: {
  initialMode: "paid" | "failed" | "confirming" | "pending";
  orderCode: string;
  boldOrderId?: string | null;
}) {
  const [mode, setMode] = useState(initialMode);
  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_ATTEMPTS = 6;
  const RETRY_DELAY_MS = 2000;

  const callReconcile = useCallback(async () => {
    try {
      const res = await fetch("/api/bold/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, boldOrderId }),
      });

      if (!res.ok) {
        return "ERROR" as ReconcileStatus;
      }

      const data = await res.json();
      return (data.status as ReconcileStatus) ?? "PENDING";
    } catch {
      return "ERROR" as ReconcileStatus;
    }
  }, [orderCode, boldOrderId]);

  const reconcile = useCallback(async () => {
    if (!mountedRef.current) return;

    const status = await callReconcile();

    if (!mountedRef.current) return;

    if (status === "PAID") {
      setMode("paid");
      return;
    }

    if (status === "REJECTED") {
      setMode("failed");
      return;
    }

    // PENDING or ERROR — schedule next retry if budget remains
    setAttempt((prev) => {
      const next = prev + 1;
      if (next < MAX_ATTEMPTS && mountedRef.current) {
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) reconcile();
        }, RETRY_DELAY_MS);
      }
      return next;
    });
  }, [callReconcile]);

  // Start initial reconciliation on mount
  useEffect(() => {
    mountedRef.current = true;

    if (mode === "confirming") {
      reconcile();
    }

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — mount-only

  // Manual retry after exhaustion
  const handleManualRetry = async () => {
    setIsRetrying(true);
    setAttempt(0);
    await reconcile();
    setIsRetrying(false);
  };

  // Update mode when parent re-renders (e.g., after webhook triggers page reload)
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const exhausted = attempt >= MAX_ATTEMPTS && mode === "confirming";

  if (mode === "confirming" && !exhausted) {
    return (
      <p className="text-xs text-muted-foreground">
        <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
        Verificando estado del pago con Bold…
        <span className="ml-1">(intento {attempt + 1}/{MAX_ATTEMPTS})</span>
      </p>
    );
  }

  if (exhausted) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          No pudimos confirmar el pago automáticamente. El pago puede estar
          procesándose. Te notificaremos por correo cuando se confirme.
        </p>
        <button
          type="button"
          onClick={handleManualRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" />
          {isRetrying ? "Verificando…" : "Verificar de nuevo"}
        </button>
      </div>
    );
  }

  return null;
}
