export type Availability = "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK" | "COMING_SOON";
export type DeliveryMode = "INMEDIATA" | "BAJO_PEDIDO";

export type ProductAvailability = {
  availability: Availability;
  canAddToCart: boolean;
  label: string;
  eta?: string;
};

export function deriveAvailability(stock: number, allowsBackorder: boolean): ProductAvailability {
  if (stock > 0) {
    return { availability: "AVAILABLE", canAddToCart: true, label: "En stock", eta: "Despacho en 24–48 horas" };
  }
  if (allowsBackorder) {
    return { availability: "ON_DEMAND", canAddToCart: true, label: "Bajo pedido", eta: "Entrega estimada: 15–20 días hábiles" };
  }
  return { availability: "OUT_OF_STOCK", canAddToCart: false, label: "Agotado" };
}

export function deliveryModeFor(stock: number, allowsBackorder: boolean): DeliveryMode | null {
  const availability = deriveAvailability(stock, allowsBackorder);
  if (!availability.canAddToCart) return null;
  return availability.availability === "AVAILABLE" ? "INMEDIATA" : "BAJO_PEDIDO";
}
