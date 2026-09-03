"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { validateMeasurementProfile } from "../schemas/size-guide-schema";
import { recommendSize } from "../services/size-recommender";
import type { SizeGuideKind, SizeRecommendation } from "../types/size-guide-types";
import type { Availability } from "../types/product-types";

export function SizeGuideDialog({ kind, variants, onApply }: { kind: SizeGuideKind; variants: { sizeCode: string; availability: Availability }[]; onApply: (size: string) => void }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<SizeRecommendation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { if (!open) { setResult(null); setErrors({}); } }, [open]);
  const calculate = () => {
    const parsed = validateMeasurementProfile({ heightCm: height, weightKg: weight });
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]))); setResult(null); return; }
    setErrors({}); setResult(recommendSize(kind, parsed.data, variants));
  };
  return <>
    <Button type="button" variant="link" className="px-0" onClick={() => setOpen(true)}>¿No sabes qué talla eres?</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby="size-guide-description">
        <DialogHeader><DialogTitle>Encuentra tu talla</DialogTitle><DialogDescription id="size-guide-description">Indica únicamente tu altura y peso. Es una orientación, no una garantía de ajuste.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {[["heightCm", "Altura", "cm", height, setHeight], ["weightKg", "Peso", "kg", weight, setWeight]].map(([id, label, unit, value, setter]) => <div key={id as string}>
            <label htmlFor={id as string} className="mb-1.5 block text-sm font-medium">{label as string} ({unit as string})</label>
            <div className="relative"><input id={id as string} inputMode="decimal" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} aria-invalid={Boolean(errors[id as string])} aria-describedby={errors[id as string] ? `${id}-error` : undefined} className="h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /><span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{unit as string}</span></div>
            {errors[id as string] && <p id={`${id as string}-error`} className="mt-1 text-xs text-destructive">{errors[id as string]}</p>}
          </div>)}
        </div>
        <Button type="button" onClick={calculate}>Ver mi talla</Button>
        <div aria-live="polite" className="min-h-10 text-sm">{result && <div className="rounded-md border border-border bg-secondary/40 p-3"><strong>{result.primarySize ? `Talla orientativa: ${result.primarySize}` : "No hay recomendación automática"}</strong><p className="mt-1 text-muted-foreground">{result.reason}</p>{result.alternativeSize && <p className="mt-1">Alternativa: {result.alternativeSize}</p>}{result.primarySize && result.availablePrimary && <Button type="button" size="sm" className="mt-3" onClick={() => { onApply(result.primarySize!); setOpen(false); }}>Aplicar talla {result.primarySize}</Button>}</div>}</div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cerrar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}