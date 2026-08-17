"use client";

import { useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FkaPreviewResult } from "../server/import-actions";
import type { ImportStatus } from "../fka/types";

const STATUS_BADGE: Record<ImportStatus, { label: string; tone: "success" | "warning" | "danger" | "muted" }> = {
  ENCONTRADO: { label: "Encontrado", tone: "success" },
  SIN_EQUIPO: { label: "Sin equipo", tone: "warning" },
  SIN_TEMPORADA: { label: "Sin temporada", tone: "warning" },
  DUPLICADO: { label: "Duplicado", tone: "danger" },
  ERROR: { label: "Error", tone: "muted" },
};

export function FkaImportResults({ result }: { result: FkaPreviewResult }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-[hsl(0_84%_95%)] p-4 text-sm text-destructive">
        {result.error}
      </div>
    );
  }

  if (result.items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No se encontraron resultados.
      </div>
    );
  }

  const importable = result.items.filter((_, i) => selected.has(i));

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            {result.items.length} resultado(s) ·{" "}
            {result.items.filter((i) => i.status === "ENCONTRADO").length} listos para importar
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" disabled={importable.length === 0}>
              Importar seleccionadas ({importable.length})
            </Button>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" /> La escritura de productos llegará en FASE 5.4.
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          {result.items.map((item, index) => {
            const badge = STATUS_BADGE[item.status];
            const isSelected = selected.has(index);
            return (
              <li key={`${item.kit.sourceUrl}-${item.kit.type}`} className="flex items-start gap-3 p-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(index)}
                  className="mt-1 accent-primary"
                  aria-label={`Seleccionar ${item.kit.title}`}
                />
                <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary">
                  {item.kit.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.kit.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Sin imagen</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{item.kit.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.kit.team} · {item.kit.season} · {item.kit.type}
                  </p>
                  {item.kit.sourceUrl && (
                    <a
                      href={item.kit.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Ver en FKA <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <p className="mt-1 text-xs">
                    Team:{" "}
                    {item.teamMatch.found ? (
                      <span className="font-medium text-success">encontrado ✓ ({item.teamMatch.name})</span>
                    ) : (
                      <span className="font-medium text-destructive">no encontrado ✗</span>
                    )}{" "}
                    · Season:{" "}
                    {item.seasonMatch.found ? (
                      <span className="font-medium text-success">encontrado ✓</span>
                    ) : (
                      <span className="font-medium text-destructive">no encontrado ✗</span>
                    )}
                  </p>
                  {item.message && <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>}
                </div>
                <Badge tone={badge.tone} className="shrink-0">
                  {badge.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}