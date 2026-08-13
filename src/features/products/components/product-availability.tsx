import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const config = {
  AVAILABLE: {
    label: "En stock",
    description: "Disponible. Despachamos en 24-48h.",
    tone: "success" as const,
  },
  ON_DEMAND: {
    label: "Bajo pedido",
    description: "Importamos bajo pedido. 15-20 días hábiles.",
    tone: "warning" as const,
  },
  OUT_OF_STOCK: {
    label: "Agotada",
    description: "No disponible por el momento.",
    tone: "danger" as const,
  },
};

export function ProductAvailability({
  availability,
  stock,
  className,
}: {
  availability: "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK";
  stock: number | null;
  className?: string;
}) {
  const info = config[availability];
  const isLow = availability === "AVAILABLE" && stock !== null && stock <= 2;

  return (
    <div className={cn("space-y-1", className)}>
      <Badge tone={isLow ? "warning" : info.tone} dot>
        {isLow ? `¡Solo ${stock} disponibles!` : info.label}
      </Badge>
      <p className="text-xs text-muted-foreground">{info.description}</p>
    </div>
  );
}
