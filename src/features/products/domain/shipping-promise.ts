import { SHIPPING } from "@/shared/config/site";
import { DELIVERY_MODE_INFO, type DeliveryMode } from "@/features/products/types/delivery-mode";

export type ShippingPromise = {
  time: string;
  fee: string;
  message: string;
};

function pesos(amount: number): string {
  const digits = Math.max(0, Math.trunc(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${digits}`;
}

/**
 * Un solo mensaje de envío para la ficha, el carrito y el checkout.
 * El tiempo sale de la modalidad elegida. El costo y el umbral salen de SHIPPING
 * (y de la tarifa nacional vigente cuando el llamador la pasa).
 */
export function publicShippingCopy(input: {
  mode: DeliveryMode | null;
  availableModes: readonly DeliveryMode[];
  nationalFeeCop: number;
  freeThresholdCop?: number;
}): ShippingPromise {
  const threshold = input.freeThresholdCop ?? SHIPPING.freeThreshold;
  const fee = Math.max(0, Math.trunc(input.nationalFeeCop));
  const feeText = fee <= 0
    ? "Envío nacional gratis."
    : `Envío nacional ${pesos(fee)}. Gratis desde ${pesos(threshold)}.`;

  const modes = input.availableModes;
  const chosen = input.mode && modes.includes(input.mode)
    ? input.mode
    : modes.length === 1
      ? modes[0]
      : null;

  let time: string;
  if (chosen === "BAJO_PEDIDO") {
    time = DELIVERY_MODE_INFO.BAJO_PEDIDO.eta;
  } else if (chosen === "INMEDIATA") {
    time = DELIVERY_MODE_INFO.INMEDIATA.eta;
  } else if (modes.includes("INMEDIATA") && modes.includes("BAJO_PEDIDO")) {
    time = "El tiempo depende de la modalidad que elijas.";
  } else if (modes.includes("BAJO_PEDIDO")) {
    time = DELIVERY_MODE_INFO.BAJO_PEDIDO.eta;
  } else if (modes.includes("INMEDIATA")) {
    time = DELIVERY_MODE_INFO.INMEDIATA.eta;
  } else {
    time = "Te confirmamos el tiempo al elegir talla.";
  }

  return { time, fee: feeText, message: `${time} ${feeText}` };
}
