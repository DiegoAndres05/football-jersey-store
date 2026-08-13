"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProductCustomization({
  enabled,
  type,
  hasPlayerPrint,
  playerNames,
  name,
  number,
  playerName,
  onTypeChange,
  onNameChange,
  onNumberChange,
  onPlayerChange,
}: {
  enabled: boolean;
  type: "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";
  hasPlayerPrint: boolean;
  playerNames: { name: string; number: string }[];
  name: string;
  number: string;
  playerName: string;
  onTypeChange: (t: "NONE" | "CUSTOM" | "OFFICIAL_PLAYER") => void;
  onNameChange: (v: string) => void;
  onNumberChange: (v: string) => void;
  onPlayerChange: (v: string) => void;
}) {
  if (!enabled) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium block">Personalización</label>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTypeChange("NONE")}
          className={cn(
            "rounded-xl border-2 px-4 py-2 text-sm transition-all",
            type === "NONE"
              ? "border-primary bg-primary/5 text-primary font-medium"
              : "border-border hover:border-muted-foreground/40",
          )}
        >
          Sin personalizar
        </button>
        <button
          onClick={() => onTypeChange("CUSTOM")}
          className={cn(
            "rounded-xl border-2 px-4 py-2 text-sm transition-all",
            type === "CUSTOM"
              ? "border-primary bg-primary/5 text-primary font-medium"
              : "border-border hover:border-muted-foreground/40",
          )}
        >
          Personalizar
        </button>
        {hasPlayerPrint && (
          <button
            onClick={() => onTypeChange("OFFICIAL_PLAYER")}
            className={cn(
              "rounded-xl border-2 px-4 py-2 text-sm transition-all",
              type === "OFFICIAL_PLAYER"
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-border hover:border-muted-foreground/40",
            )}
          >
            Jugador oficial
          </button>
        )}
      </div>

      {type === "CUSTOM" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="custom-name">Nombre</Label>
            <Input
              id="custom-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Vinicius"
              maxLength={15}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="custom-number">Número</Label>
            <Input
              id="custom-number"
              value={number}
              onChange={(e) => onNumberChange(e.target.value)}
              placeholder="7"
              maxLength={2}
            />
          </div>
        </div>
      )}

      {type === "OFFICIAL_PLAYER" && (
        <div className="space-y-1.5">
          <Label htmlFor="official-player">Jugador</Label>
          <select
            id="official-player"
            value={playerName}
            onChange={(e) => onPlayerChange(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar jugador</option>
            {playerNames.map((p) => (
              <option key={p.name} value={`${p.name} - ${p.number}`}>
                {p.name} - {p.number}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
