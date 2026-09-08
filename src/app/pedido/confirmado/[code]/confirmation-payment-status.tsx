"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Client component that polls (router.refresh) while the payment is in
 * "confirming" state. Stops when status resolves to paid/failed or
 * attempts are exhausted — never marks as failed by timeout.
 *
 * Spec: T015 — soft-retry ~2s × 3–4.
 */
export function ConfirmationPaymentStatus({
  initialMode,
  orderCode,
}: {
  initialMode: "paid" | "failed" | "confirming" | "pending";
  orderCode: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 4;
  const INTERVAL_MS = 2000;

  useEffect(() => {
    if (mode !== "confirming") return;
    if (attemptsRef.current >= MAX_ATTEMPTS) return;

    const timer = setInterval(() => {
      attemptsRef.current += 1;
      router.refresh();
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [mode, router]);

  // Update mode when parent re-renders with new initialMode
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (mode === "confirming") {
    return (
      <p className="text-xs text-muted-foreground">
        <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
        Verificando estado del pago con Bold…
        {attemptsRef.current < MAX_ATTEMPTS && (
          <span className="ml-1">(intento {attemptsRef.current + 1}/{MAX_ATTEMPTS})</span>
        )}
      </p>
    );
  }

  return null;
}
