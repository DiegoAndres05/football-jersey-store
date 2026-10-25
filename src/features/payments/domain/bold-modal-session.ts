/**
 * Estado del modal embebido de Bold en el navegador.
 * Cerrar el modal, cancelar o agotar el tiempo no es un pago aprobado.
 * La confirmación sigue siendo solo el webhook o la API de Bold.
 */

export const BOLD_CHECKOUT_EVENT = "BOLD_CHECKOUT_EVENT";
export const BOLD_MODAL_OPEN_TIMEOUT_MS = 20_000;

const BOLD_ORIGINS = [
  "https://checkout.bold.co",
  "https://stg.checkout.bold.co",
  "https://qa.checkout.bold.co",
];

export type CheckoutPaymentPhase = "idle" | "preparing" | "processing" | "retry" | "success" | "failed";
export type BoldModalSignal = "opened" | "closed" | "timeout";

export function isBoldCheckoutCloseEvent(origin: string, data: unknown, pageOrigin?: string): boolean {
  const allowed = pageOrigin ? [...BOLD_ORIGINS, pageOrigin] : [...BOLD_ORIGINS];
  if (!allowed.includes(origin)) return false;
  if (!data || typeof data !== "object") return false;
  return (data as { type?: string }).type === BOLD_CHECKOUT_EVENT;
}

/** El evento de cierre nunca autoriza a marcar el pedido como pagado. */
export function boldEventMarksPaid(_data: unknown): false {
  return false;
}

export function nextBoldModalPhase(phase: CheckoutPaymentPhase, signal: BoldModalSignal): CheckoutPaymentPhase {
  if (phase === "success" || phase === "failed") return phase;
  if (signal === "opened") return "processing";
  if (signal === "closed") return "retry";
  if (signal === "timeout" && (phase === "processing" || phase === "preparing")) return "retry";
  return phase;
}
