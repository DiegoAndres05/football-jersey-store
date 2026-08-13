"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlayerData } from "@/features/products/types/product-types";

type CustomType = "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";

export function ProductCustomization({
  enabled,
  type,
  hasPlayerPrint,
  players,
  surcharge,
  name,
  number,
  selectedPlayerId,
  onTypeChange,
  onNameChange,
  onNumberChange,
  onPlayerChange,
}: {
  enabled: boolean;
  type: CustomType;
  hasPlayerPrint: boolean;
  players: PlayerData[];
  surcharge: number;
  name: string;
  number: string;
  selectedPlayerId: string;
  onTypeChange: (t: CustomType) => void;
  onNameChange: (v: string) => void;
  onNumberChange: (v: string) => void;
  onPlayerChange: (v: string) => void;
}) {
  if (!enabled) return null;

  const options: { value: CustomType; label: string }[] = [
    { value: "NONE", label: "Sin personalizar" },
    { value: "CUSTOM", label: "Personalizar" },
    ...(hasPlayerPrint && players.length > 0 ? [{ value: "OFFICIAL_PLAYER" as const, label: "Jugador" }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium block">Personalización</label>
        {surcharge > 0 && (
          <span className="text-xs text-muted-foreground">
            Adicional: ${surcharge.toLocaleString("es-CO")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const isSelected = type === o.value;
          return (
            <button
              key={o.value}
              aria-pressed={isSelected}
              onClick={() => onTypeChange(o.value)}
              className={cn(
                "rounded-xl border-2 px-4 py-2 text-sm transition-all",
                isSelected
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {type === "CUSTOM" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="custom-name">Nombre</Label>
            <Input
              id="custom-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Tu nombre"
              maxLength={15}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="custom-number">Número</Label>
            <Input
              id="custom-number"
              value={number}
              onChange={(e) => onNumberChange(e.target.value)}
              placeholder="Ej: 10"
              maxLength={2}
              inputMode="numeric"
            />
          </div>
        </div>
      )}

      {type === "OFFICIAL_PLAYER" && (
        <div className="space-y-1.5">
          <Label htmlFor="official-player">Selecciona el jugador</Label>
          <select
            id="official-player"
            value={selectedPlayerId}
            onChange={(e) => onPlayerChange(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Elegir jugador</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.number}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}