"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlayerData } from "@/features/products/types/product-types";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { formatMoney } from "@/shared/money/format";

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
  currencyContext,
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
  currencyContext?: CurrencyContext;
}) {
  if (!enabled) return null;

  const options: { value: CustomType; label: string }[] = [
    { value: "NONE", label: "Sin personalizar" },
    { value: "CUSTOM", label: "Personalizar" },
    ...(hasPlayerPrint && players.length > 0 ? [{ value: "OFFICIAL_PLAYER" as const, label: "Jugador" }] : []),
  ];

  const selectedPlayer = players.find((player) => player.id === selectedPlayerId);
  const previewName =
    type === "CUSTOM" ? name.trim() || "Tu nombre aquí" : type === "OFFICIAL_PLAYER" ? selectedPlayer?.name ?? "Tu nombre aquí" : "Tu nombre aquí";
  const previewNumber =
    type === "CUSTOM" ? number.trim() || "10" : type === "OFFICIAL_PLAYER" ? selectedPlayer?.number ?? "10" : "10";

  return (
    <div className="space-y-4 rounded-[22px] border border-[#ece8e3] bg-white p-4">
      <div className="rounded-[22px] bg-[#12141a] px-5 py-5 text-white">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9aa0aa]">
          Vista previa de estampado
        </p>
        <div className="mt-4 rounded-2xl border border-dashed border-[#3a3f4a] px-4 py-6 text-center">
          <p className="text-[18px] font-extrabold uppercase tracking-[0.08em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
            {previewName}
          </p>
          <p className="mt-1 text-[64px] font-extrabold leading-none tracking-[-0.04em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
            {previewNumber}
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa0aa]">
            Parche oficial incluido
          </p>
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <label className="block text-sm font-extrabold uppercase tracking-[-0.03em] [font-family:var(--font-ui-heavy),var(--font-sans)]">Personalización</label>
        {surcharge > 0 && (
          <span className="text-xs text-muted-foreground">
            Adicional:{" "}
            {formatMoney({
              amountCop: surcharge,
              currency: currencyContext?.currency ?? "COP",
              copPerUsd: currencyContext?.copPerUsd ?? undefined,
            })}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const isSelected = type === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onTypeChange(o.value)}
              className={cn(
                "min-h-11 rounded-xl border-2 px-4 py-2 text-sm transition-all",
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
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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