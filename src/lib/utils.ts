import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Precios — todo en centavos COP internamente
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents);
}

export function formatPriceShort(cents: number): string {
  if (cents >= 1_000_000) {
    return `$${(cents / 1_000_000).toFixed(1)}M`;
  }
  if (cents >= 1_000) {
    return `$${Math.round(cents / 1_000)}K`;
  }
  return `$${cents}`;
}

// Disponibilidad
export const AVAILABILITY_LABELS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "muted"; description: string }> = {
  AVAILABLE: {
    label: "Entrega inmediata",
    tone: "success",
    description: "En stock. Despachamos en 24-48h.",
  },
  ON_DEMAND: {
    label: "Bajo pedido",
    tone: "warning",
    description: "Importamos bajo pedido. 15-20 días hábiles.",
  },
  OUT_OF_STOCK: {
    label: "Agotada",
    tone: "danger",
    description: "No disponible por el momento.",
  },
  COMING_SOON: {
    label: "Próximamente",
    tone: "muted",
    description: "Disponible en los próximos días.",
  },
};

export function availabilityInfo(availability: string, stock?: number | null) {
  if (availability === "AVAILABLE" && stock !== null && stock !== undefined && stock <= 2) {
    return {
      label: `¡Solo ${stock} disponibles!`,
      tone: "warning" as const,
      description: "Últimas unidades en inventario local.",
    };
  }
  return AVAILABILITY_LABELS[availability] ?? AVAILABILITY_LABELS.OUT_OF_STOCK;
}

// Estados del pedido
export const ORDER_STATUS_LABELS: Record<string, { label: string; tone: "muted" | "warning" | "info" | "success" | "danger" }> = {
  PENDING_PAYMENT:    { label: "Pendiente de pago",   tone: "muted"   },
  PAID:               { label: "Pagado",              tone: "info"    },
  VALIDATING:         { label: "Validando inventario", tone: "warning" },
  RESERVED:           { label: "Reservado",           tone: "info"    },
  SUPPLIER_REQUESTED: { label: "Pedido al proveedor", tone: "warning" },
  IN_TRANSIT:         { label: "En tránsito",         tone: "warning" },
  PREPARING:          { label: "Preparando envío",    tone: "warning" },
  SHIPPED:            { label: "Enviado",             tone: "info"    },
  DELIVERED:          { label: "Entregado",           tone: "success" },
  COMPLETED:          { label: "Finalizado",          tone: "success" },
  CANCELLED:          { label: "Cancelado",           tone: "danger"  },
  REFUNDED:           { label: "Reembolsado",         tone: "danger"  },
  RETURNED:           { label: "Devuelto",            tone: "danger"  },
  PAYMENT_FAILED:     { label: "Pago rechazado",      tone: "danger"  },
};

export function statusInfo(status: string) {
  return ORDER_STATUS_LABELS[status] ?? { label: status, tone: "muted" as const };
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(d));
}

export function formatOrderCode(code: string) {
  return code;
}
