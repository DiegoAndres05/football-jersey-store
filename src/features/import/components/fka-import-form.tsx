"use client";

import { useState } from "react";
import { Search, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchFkaPreviewAction, type FkaPreviewResult } from "../server/import-actions";
import type { FkaKitType } from "../fka/types";
import { FkaImportResults } from "./fka-import-results";

const TYPE_OPTIONS: { value: FkaKitType; label: string }[] = [
  { value: "LOCAL", label: "Local" },
  { value: "VISITANTE", label: "Visitante" },
  { value: "TERCERA", label: "Tercera" },
];

export function FkaImportForm() {
  const [teams, setTeams] = useState("Real Madrid, Barcelona");
  const [season, setSeason] = useState("2026-27");
  const [types, setTypes] = useState<FkaKitType[]>(["LOCAL", "VISITANTE", "TERCERA"]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<FkaPreviewResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const parsedTeams = teams
        .split(/[\n,]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      setResult(await searchFkaPreviewAction({ teams: parsedTeams, season: season.trim(), types }));
    } finally {
      setPending(false);
    }
  }

  function toggleType(type: FkaKitType) {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-border bg-card p-5 space-y-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Previsualización · Football Kit Archive
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            La búsqueda es de solo lectura: no escribe nada en la base de datos.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="import-teams">Equipos (separados por coma o salto de línea)</Label>
            <textarea
              id="import-teams"
              value={teams}
              onChange={(e) => setTeams(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Real Madrid, Barcelona, Girona, PSG, Atlético de Madrid"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-season">Temporada</Label>
              <Input
                id="import-season"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2026-27"
              />
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Tipos de camiseta</legend>
              <div className="mt-2 flex gap-4">
                {TYPE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={types.includes(option.value)}
                      onChange={() => toggleType(option.value)}
                      className="accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending || types.length === 0}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {pending ? "Buscando en FKA…" : "Buscar"}
          </Button>
          {pending && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Download className="h-4 w-4" /> Usando la sesión persistente del navegador
            </span>
          )}
        </div>
      </form>

      {result && <FkaImportResults result={result} />}
    </div>
  );
}