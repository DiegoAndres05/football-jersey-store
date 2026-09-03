"use client";

import { useState } from "react";
import { ExternalLink, Info, Loader2, Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { importFkaKitsAction, type FkaImportActionResult } from "../server/import-actions";
import type { FkaPreviewResult } from "../server/import-actions";
import type { FkaKit, ImportStatus, ImportPreviewItem } from "../fka/types";

const STATUS_BADGE: Record<ImportStatus, { label: string; tone: "success" | "warning" | "danger" | "muted" }> = {
  ENCONTRADO: { label: "Encontrado", tone: "success" },
  SIN_EQUIPO: { label: "Sin equipo", tone: "warning" },
  SIN_TEMPORADA: { label: "Sin temporada", tone: "warning" },
  DUPLICADO: { label: "Duplicado", tone: "danger" },
  ERROR: { label: "Error", tone: "muted" },
};

type ImportItemStatus = "IMPORTADO" | "DUPLICADO" | "SIN_TEMPORADA" | "SIN_EQUIPO" | "ERROR";

const IMPORT_BADGE: Record<ImportItemStatus, { label: string; tone: "success" | "warning" | "danger" | "muted" }> = {
  IMPORTADO: { label: "Importado", tone: "success" },
  DUPLICADO: { label: "Duplicado", tone: "warning" },
  SIN_TEMPORADA: { label: "Sin temporada", tone: "warning" },
  SIN_EQUIPO: { label: "Sin equipo", tone: "danger" },
  ERROR: { label: "Error", tone: "danger" },
};

export function FkaImportResults({ result }: { result: FkaPreviewResult }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<FkaImportActionResult | null>(null);
  const [confirm, setConfirm] = useState<{ kits: FkaKit[]; seasons?: string[]; teams?: string[] } | null>(null);

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

  const isSelectable = (item: ImportPreviewItem) =>
    item.status === "ENCONTRADO" ||
    item.status === "SIN_EQUIPO" ||
    (item.status === "SIN_TEMPORADA" && item.teamMatch.found);

  const importable = result.items.filter((_, i) => selected.has(i));
  const readyCount = result.items.filter(isSelectable).length;

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function onImport() {
    if (importable.length === 0) return;
    setImporting(true);
    setImportResult(null);
    setConfirm(null);
    try {
      const res = await importFkaKitsAction(importable.map((item) => item.kit));
      if (res.ok && "needsTeams" in res) {
        setConfirm({ kits: importable.map((item) => item.kit), teams: res.teams });
        return;
      }
      if (res.ok && "needsSeasons" in res) {
        setConfirm({ kits: importable.map((item) => item.kit), seasons: res.seasons });
        return;
      }
      setImportResult(res);
    } finally {
      setImporting(false);
    }
  }

  async function onConfirmImport() {
    if (!confirm) return;
    setImporting(true);
    setImportResult(null);
    try {
      setImportResult(await importFkaKitsAction(confirm.kits, { createSeasons: true, createTeams: true }));
    } finally {
      setImporting(false);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            {result.items.length} resultado(s) ·{" "}
            {readyCount} listos para importar
          </p>
          <Button type="button" onClick={onImport} disabled={importing || importable.length === 0}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
            Importar seleccionadas ({importable.length})
          </Button>
        </div>
      </div>

      {importResult && (
        <ImportSummary result={importResult} />
      )}

      {confirm && !importing && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">
            Faltan recursos para importar
          </p>
          {confirm.teams && confirm.teams.length > 0 && (
            <>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-amber-900">
                {confirm.teams.map((team) => (
                  <li key={team}>
                    El equipo <strong>{team}</strong> no existe en Flashsport.
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-amber-800">
                Se crearán automáticamente en la liga &ldquo;Otros&rdquo;.
              </p>
            </>
          )}
          {confirm.seasons && confirm.seasons.length > 0 && (
            <>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-amber-900">
                {confirm.seasons.map((season) => (
                  <li key={season}>
                    La temporada <strong>{season}</strong> no existe en Flashsport.
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-2 text-sm text-amber-900">
            ¿Quieres crear los recursos faltantes e importar las camisetas
            seleccionadas? Los productos se crearán como borradores (inactivos).
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirm(null)} disabled={importing}>
              Cancelar
            </Button>
            <Button type="button" onClick={onConfirmImport} disabled={importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Crear e importar
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          {result.items.map((item, index) => {
            const badge = STATUS_BADGE[item.status];
            const isSelected = selected.has(index);
            const selectable = isSelectable(item);
            return (
              <li key={`${item.kit.sourceUrl}-${item.kit.type}`} className="flex items-start gap-3 p-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!selectable}
                  onChange={() => toggle(index)}
                  className="mt-1 accent-primary disabled:cursor-not-allowed"
                  aria-label={`Seleccionar ${item.kit.title}`}
                />
                <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary">
                  {item.previewImage ?? item.kit.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.previewImage ?? item.kit.imageUrl ?? ""} alt="" className="h-full w-full object-cover" loading="lazy" />
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

function ImportSummary({ result }: { result: FkaImportActionResult }) {
  if (!result.ok) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-[hsl(0_84%_95%)] p-4 text-sm text-destructive">
        {result.error}
      </div>
    );
  }
  if ("needsSeasons" in result || "needsTeams" in result) return null;

  const s = result.result.summary;
  return (
    <div className="rounded-xl border border-success/30 bg-[hsl(142_71%_96%)] p-4">
      <p className="flex items-center gap-2 font-semibold text-success">
        <Check className="h-4 w-4" /> IMPORTACIÓN COMPLETADA
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        <li>✓ {s.imported} producto(s) importado(s) como borrador</li>
        {s.duplicated > 0 && <li>↪ {s.duplicated} duplicado(s) omitido(s)</li>}
        {s.sinTemporada > 0 && <li>⚠ {s.sinTemporada} sin temporada (no importados)</li>}
        {s.sinEquipo > 0 && <li>⚠ {s.sinEquipo} sin equipo (no importados)</li>}
        {s.errors > 0 && <li>✕ {s.errors} error(es)</li>}
      </ul>

      {s.imported > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Los productos importados quedaron como <strong>borradores</strong> (inactivos). Revísalos y publícalos
          desde /admin/productos.
        </p>
      )}

      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        {result.result.items.map((item, i) => {
          const badge = IMPORT_BADGE[item.status];
          return (
            <div key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              {item.status === "IMPORTADO" && item.slug ? (
                <span className="shrink-0 text-xs text-muted-foreground">/productos/{item.slug}</span>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">{item.message}</span>
              )}
              <Badge tone={badge.tone} className="shrink-0">
                {badge.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
