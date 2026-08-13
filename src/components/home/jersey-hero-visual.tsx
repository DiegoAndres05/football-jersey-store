import { Shirt } from "lucide-react";

/**
 * Placeholder editorial del hero: silueta de camiseta sobre retícula de puntos.
 * Se reemplazará por fotografía real de producto cuando esté disponible.
 */
export function JerseyHeroVisual() {
  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-card aspect-[4/5] max-w-md mx-auto w-full">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px]"
      />
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[9rem] lg:text-[11rem] font-bold uppercase leading-none text-muted select-none opacity-60">
          FS
        </span>
      </div>
      <Shirt
        aria-hidden
        className="relative h-3/5 w-auto text-foreground mix-blend-multiply"
        strokeWidth={1}
      />
      <div className="absolute bottom-5 left-5 right-5 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Temporada 25/26
        </span>
        <span className="font-display text-2xl font-bold uppercase tracking-wider">Nos. 01</span>
      </div>
    </div>
  );
}