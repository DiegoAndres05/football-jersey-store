"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductosError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-md flex flex-col items-center text-center rounded-xl border border-dashed border-border bg-card px-8 py-14">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">
          Algo salió mal
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          No pudimos cargar el catálogo. Intenta de nuevo en unos segundos.
        </p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}