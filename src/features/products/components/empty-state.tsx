import Link from "next/link";
import { SearchX, Shirt, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  variant = "catalog",
  className,
}: {
  variant?: "results" | "catalog";
  className?: string;
}) {
  const isResults = variant === "results";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border bg-card",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {isResults ? <SearchX className="h-6 w-6" /> : <Shirt className="h-6 w-6" strokeWidth={1.5} />}
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">
        {isResults ? "Sin resultados" : "Sin productos"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
        {isResults
          ? "No encontramos camisetas con esos filtros. Prueba con otras opciones."
          : "Todavía no hay camisetas publicadas. Vuelve pronto."}
      </p>
      <Button variant="outline" className="mt-6" asChild>
        <Link href={isResults ? "/productos" : "/"}>
          {isResults ? "Limpiar filtros" : "Volver al inicio"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}