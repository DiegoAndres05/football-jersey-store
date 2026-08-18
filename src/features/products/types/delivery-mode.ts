export type DeliveryMode = "INMEDIATA" | "BAJO_PEDIDO";

export const DELIVERY_MODE_INFO: Record<
  DeliveryMode,
  { label: string; description: string; eta: string }
> = {
  INMEDIATA: {
    label: "Entrega inmediata",
    description: "Disponible para despacho.",
    eta: "Despacho en 24–48 horas.",
  },
  BAJO_PEDIDO: {
    label: "Bajo pedido",
    description: "La conseguimos para ti.",
    eta: "Tiempo estimado: 15–20 días.",
  },
};

/**
 * Modalidades efectivamente ofrecidas para una variante.
 * INMEDIATA requiere stock físico (ledger > 0); BAJO_PEDIDO se ofrece
 * si el admin lo permite, con o sin stock.
 */
export function getAvailableDeliveryModes(
  stock: number | null,
  allowsBackorder: boolean,
): DeliveryMode[] {
  const hasStock = (stock ?? 0) > 0;
  const modes: DeliveryMode[] = [];
  if (hasStock) modes.push("INMEDIATA");
  if (allowsBackorder) modes.push("BAJO_PEDIDO");
  return modes;
}