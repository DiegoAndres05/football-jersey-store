import type { PaymentMethod } from "@/features/checkout/schemas/checkout-schema";

/**
 * SIMULACIÓN DE PAGO (modo demo).
 *
 * No hay pasarela conectada todavía: este servicio imita el flujo de cobro
 * para validar la experiencia de compra de punta a punta. NUNCA cobra,
 * NUNCA pide datos de tarjeta y siempre queda marcado como simulación
 * frente al usuario. Reemplazar con la integración real en producción.
 */

export type MockPaymentResult =
  | { ok: true; reference: string; paidAt: Date; method: PaymentMethod; amount: number }
  | { ok: false; reason: string };

const PROCESSING_MS = 1800;

export async function processMockPayment(args: {
  method: PaymentMethod;
  amount: number;
}): Promise<MockPaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));

  return {
    ok: true,
    reference: `SIM-${Date.now().toString(36).toUpperCase()}`,
    paidAt: new Date(),
    method: args.method,
    amount: args.amount,
  };
}