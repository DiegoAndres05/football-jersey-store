const ITEMS = [
  "Camisetas de fútbol",
  "Personaliza con nombre y número",
  "Envío nacional desde $200.000",
  "Temporada 25/26",
] as const;

export function Ticker() {
  const sequence = [...ITEMS, ...ITEMS];
  return (
    <div
      aria-hidden
      className="overflow-hidden border-t border-border bg-foreground text-background py-2.5 select-none"
    >
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {[0, 1].map((round) => (
          <div key={round} className="flex shrink-0 items-center">
            {sequence.map((item, i) => (
              <span
                key={`${round}-${i}`}
                className="flex items-center gap-6 pr-6 text-[11px] font-semibold uppercase tracking-[0.24em]"
              >
                {item}
                <span className="text-background/40">●</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}