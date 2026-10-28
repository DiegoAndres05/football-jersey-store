"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { seasonFilterLabel } from "@/features/products/domain/season-label";
import {
  applySheetDraft,
  countSheetFilters,
  emptySheetDraft,
  priceSliderStep,
  sheetDraftFromSearch,
  sheetQueriesMatch,
  type PriceBounds,
  type SheetDraft,
} from "@/features/products/domain/catalog-sheet-query";
import { countFilteredProducts } from "@/features/products/server/catalog-count-action";
import { formatMoney, type Currency } from "@/shared/money/format";
import { cn } from "@/lib/utils";

type League = { slug: string; name: string };
type Team = { slug: string; name: string; leagueSlug: string | null };
type Season = { slug: string; name: string; isRetro: boolean };
type Version = { slug: string; name: string };
type Size = { code: string };
type CurrencyView = { currency: Currency; copPerUsd: number | null };

const DELIVERY = [
  { value: "INMEDIATA", label: "Entrega inmediata" },
  { value: "BAJO_PEDIDO", label: "Bajo pedido" },
] as const;

const AVAILABILITY = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "OUT_OF_STOCK", label: "Agotado" },
] as const;

const RANGE_INPUT =
  "pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 " +
  "[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-neutral-950 " +
  "[&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.35)] " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px] " +
  "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 " +
  "[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-neutral-950";

function formatSheetAmount(amount: number, currency: CurrencyView): string {
  const formatted = formatMoney({
    amountCop: amount,
    currency: currency.currency,
    copPerUsd: currency.copPerUsd ?? undefined,
  });
  return currency.currency === "COP" ? formatted.replace(/ COP$/, "") : formatted;
}

function formatSheetRange(min: number, max: number, currency: CurrencyView): string {
  const left = formatSheetAmount(min, currency);
  const right = formatSheetAmount(max, currency);
  return currency.currency === "COP" ? `${left} - ${right} COP` : `${left} - ${right}`;
}

function queryRecord(href: string): Record<string, string> {
  const search = href.includes("?") ? href.slice(href.indexOf("?") + 1) : "";
  return Object.fromEntries(new URLSearchParams(search));
}

export function MobileFilterSheet({
  leagues,
  teams,
  seasons,
  versions,
  sizes,
  priceBounds,
  total,
  currency,
}: {
  leagues: League[];
  teams: Team[];
  seasons: Season[];
  versions: Version[];
  sizes: Size[];
  priceBounds: PriceBounds;
  total: number;
  currency: CurrencyView;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const titleId = useId();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SheetDraft | null>(null);
  const [panel, setPanel] = useState<"liga" | "temporada" | "disponibilidad" | null>(null);
  const [matchCount, setMatchCount] = useState(total);
  const [counting, setCounting] = useState(false);
  const requestId = useRef(0);

  const bounds = useMemo<PriceBounds>(
    () => ({ min: priceBounds.min, max: Math.max(priceBounds.min, priceBounds.max) }),
    [priceBounds.min, priceBounds.max],
  );
  const searchKey = searchParams.toString();
  const applied = useMemo(() => sheetDraftFromSearch(searchKey, bounds), [searchKey, bounds]);
  const current = draft ?? applied;
  const activeCount = countSheetFilters(current, bounds);
  const appliedCount = countSheetFilters(applied, bounds);
  const leagueHint = useMemo(() => {
    const names = leagues.slice(0, 3).map((league) => league.name);
    if (names.length === 0) return "Todas las ligas";
    return leagues.length > 3
      ? `Todas las ligas (${names.join(", ")}...)`
      : `Todas las ligas (${names.join(", ")})`;
  }, [leagues]);

  const previewHref = applySheetDraft(pathname, searchKey, current, bounds);

  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const appliedHref = applySheetDraft(pathname, searchKey, applied, bounds);
    if (previewHref === appliedHref) {
      setMatchCount(total);
      setCounting(false);
      return;
    }
    const request = ++requestId.current;
    setCounting(true);
    const timer = window.setTimeout(() => {
      void countFilteredProducts(queryRecord(previewHref))
        .then((count) => {
          if (requestId.current !== request) return;
          setMatchCount(count);
          setCounting(false);
        })
        .catch(() => {
          if (requestId.current === request) setCounting(false);
        });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [open, previewHref, pathname, searchKey, applied, bounds, total]);

  function update(patch: Partial<SheetDraft>) {
    setDraft({ ...current, ...patch });
  }

  function openSheet() {
    setDraft(applied);
    setPanel(null);
    setMatchCount(total);
    setOpen(true);
  }

  function closeSheet(next: boolean) {
    setOpen(next);
    if (!next) {
      setDraft(null);
      setPanel(null);
    }
  }

  function apply() {
    const href = applySheetDraft(pathname, searchKey, current, bounds);
    if (sheetQueriesMatch(searchKey, href)) {
      closeSheet(false);
      return;
    }
    startTransition(() => {
      router.push(href, { scroll: false });
    });
    closeSheet(false);
  }

  const selectedLeague = leagues.find((league) => league.slug === current.league);
  const selectedTeam = teams.find((team) => team.slug === current.team);
  const selectedSeason = seasons.find((season) => season.slug === current.season);
  const leagueTeams = teams.filter((team) => team.leagueSlug === current.league);
  const leagueSubtitle = selectedLeague
    ? selectedTeam
      ? `${selectedLeague.name} · ${selectedTeam.name}`
      : selectedLeague.name
    : leagueHint;
  const seasonSubtitle = selectedSeason ? seasonFilterLabel(selectedSeason) : "Todas las temporadas";
  const availabilitySubtitle =
    AVAILABILITY.find((option) => option.value === current.availability)?.label ?? "Todas";
  const showPrice = bounds.max > bounds.min;
  const noun = matchCount === 1 ? "camiseta" : "camisetas";

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        <span>Filtros</span>
        {appliedCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold leading-none text-background">
            {appliedCount}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={closeSheet}>
        <DialogPortal>
          <DialogOverlay className="bg-black/45 backdrop-blur-[2px]" />
          <DialogPrimitive.Content
            aria-labelledby={titleId}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[var(--z-modal)] flex max-h-[88dvh] flex-col rounded-t-[1.75rem] bg-card text-foreground shadow-[0_-16px_50px_rgba(0,0,0,0.18)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
              "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
              "duration-300 focus:outline-none",
            )}
          >
            <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <DialogTitle
                  id={titleId}
                  className="font-display text-[1.7rem] font-bold uppercase leading-none tracking-tight"
                >
                  Filtros
                </DialogTitle>
                {activeCount > 0 && (
                  <span className="inline-flex h-6 items-center rounded-full bg-foreground px-2.5 text-[11px] font-semibold text-background">
                    {activeCount} {activeCount === 1 ? "activo" : "activos"}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => setDraft(emptySheetDraft(bounds))}
                  className="px-2 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Limpiar
                </button>
                <DialogClose className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Cerrar</span>
                </DialogClose>
              </div>
            </div>
            <DialogDescription className="sr-only">
              Elige talla, edición, entrega, liga y precio. El catálogo cambia al aplicar.
            </DialogDescription>

            <div className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 pb-4 pt-3">
              <section>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em]">Talla</h3>
                  {current.size && (
                    <p className="text-xs text-muted-foreground">1 seleccionada ({current.size})</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const selected = current.size === size.code;
                    return (
                      <button
                        key={size.code}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => update({ size: selected ? "" : size.code })}
                        className={cn(
                          "flex h-12 min-w-12 items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "border-foreground bg-foreground text-background shadow-sm"
                            : "border-border bg-card text-foreground hover:border-foreground/30",
                        )}
                      >
                        {size.code}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em]">Tipo de edición</h3>
                <div className="flex flex-wrap gap-2">
                  {versions.map((version) => {
                    const selected = current.version === version.slug;
                    return (
                      <button
                        key={version.slug}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => update({ version: selected ? "" : version.slug })}
                        className={cn(
                          "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card text-foreground hover:border-foreground/30",
                        )}
                      >
                        {version.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em]">Modalidad de entrega</h3>
                <div className="grid grid-cols-2 gap-2">
                  {DELIVERY.map((option) => (
                    <ChoiceCard
                      key={option.value}
                      label={option.label}
                      selected={current.deliveryMode === option.value}
                      onClick={() =>
                        update({
                          deliveryMode: current.deliveryMode === option.value ? "" : option.value,
                        })
                      }
                    />
                  ))}
                </div>
              </section>

              <Disclosure
                title="Liga / torneo"
                subtitle={leagueSubtitle}
                open={panel === "liga"}
                onToggle={() => setPanel((value) => (value === "liga" ? null : "liga"))}
              >
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-border p-1">
                  <ListOption
                    label="Todas las ligas"
                    selected={!current.league}
                    onClick={() => update({ league: "", team: "" })}
                  />
                  {leagues.map((league) => (
                    <ListOption
                      key={league.slug}
                      label={league.name}
                      selected={current.league === league.slug}
                      onClick={() =>
                        update({
                          league: current.league === league.slug ? "" : league.slug,
                          team: "",
                        })
                      }
                    />
                  ))}
                </div>
                {current.league && leagueTeams.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em]">Equipo</p>
                    <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                      {leagueTeams.map((team) => {
                        const selected = current.team === team.slug;
                        return (
                          <button
                            key={team.slug}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => update({ team: selected ? "" : team.slug })}
                            className={cn(
                              "inline-flex h-10 items-center rounded-full border px-3.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              selected
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-card text-foreground",
                            )}
                          >
                            {team.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Disclosure>

              <Disclosure
                title="Temporada"
                subtitle={seasonSubtitle}
                open={panel === "temporada"}
                onToggle={() => setPanel((value) => (value === "temporada" ? null : "temporada"))}
              >
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-border p-1">
                  <ListOption
                    label="Todas las temporadas"
                    selected={!current.season}
                    onClick={() => update({ season: "" })}
                  />
                  {seasons.map((season) => (
                    <ListOption
                      key={season.slug}
                      label={seasonFilterLabel(season)}
                      selected={current.season === season.slug}
                      onClick={() =>
                        update({ season: current.season === season.slug ? "" : season.slug })
                      }
                    />
                  ))}
                </div>
              </Disclosure>

              <Disclosure
                title="Disponibilidad"
                subtitle={availabilitySubtitle}
                open={panel === "disponibilidad"}
                onToggle={() =>
                  setPanel((value) => (value === "disponibilidad" ? null : "disponibilidad"))
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY.map((option) => (
                    <ChoiceCard
                      key={option.value}
                      label={option.label}
                      selected={current.availability === option.value}
                      onClick={() =>
                        update({
                          availability: current.availability === option.value ? "" : option.value,
                        })
                      }
                    />
                  ))}
                </div>
              </Disclosure>

              {showPrice && (
                <section className="border-t border-border pt-4">
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em]">Rango de precio</h3>
                    <p className="text-right text-xs font-medium tabular-nums text-foreground">
                      {formatSheetRange(current.minPrice, current.maxPrice, currency)}
                    </p>
                  </div>
                  <PriceRange
                    bounds={bounds}
                    minPrice={current.minPrice}
                    maxPrice={current.maxPrice}
                    onChange={(next) => update(next)}
                  />
                </section>
              )}
            </div>

            <div className="border-t border-border px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={apply}
                disabled={isPending}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 font-display text-[15px] font-bold uppercase tracking-wide text-background transition-colors hover:bg-[hsl(var(--primary-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70"
              >
                <span className={cn(counting && "opacity-70")} aria-live="polite">
                  Ver {matchCount} {noun}
                </span>
                <span aria-hidden className="text-background/45">|</span>
                <span>Aplicar filtros</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}

function Disclosure({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-[0.16em]">{title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{subtitle}</span>
        </span>
        <ChevronDown
          className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </section>
  );
}

function ChoiceCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex h-12 min-w-0 items-center justify-between gap-2 rounded-2xl border px-3 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-foreground bg-card shadow-sm" : "border-border bg-card text-foreground",
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border",
          selected ? "border-foreground bg-foreground text-background" : "border-neutral-300 bg-card",
        )}
        aria-hidden
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

function ListOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "bg-foreground font-medium text-background" : "hover:bg-accent",
      )}
    >
      <span className="truncate">{label}</span>
      {selected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
    </button>
  );
}

function PriceRange({
  bounds,
  minPrice,
  maxPrice,
  onChange,
}: {
  bounds: PriceBounds;
  minPrice: number;
  maxPrice: number;
  onChange: (next: { minPrice: number; maxPrice: number }) => void;
}) {
  const step = priceSliderStep(bounds.min, bounds.max);
  const span = Math.max(1, bounds.max - bounds.min);
  const left = ((minPrice - bounds.min) / span) * 100;
  const width = ((maxPrice - minPrice) / span) * 100;

  return (
    <div className="relative h-8">
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground"
        style={{ left: `${left}%`, width: `${Math.max(0, width)}%` }}
      />
      <input
        type="range"
        min={bounds.min}
        max={bounds.max}
        step={step}
        value={minPrice}
        aria-label="Precio mínimo"
        onChange={(event) => onChange({ minPrice: Math.min(Number(event.target.value), maxPrice), maxPrice })}
        className={RANGE_INPUT}
        style={{ zIndex: minPrice > bounds.min ? 30 : 20 }}
      />
      <input
        type="range"
        min={bounds.min}
        max={bounds.max}
        step={step}
        value={maxPrice}
        aria-label="Precio máximo"
        onChange={(event) => onChange({ minPrice, maxPrice: Math.max(Number(event.target.value), minPrice) })}
        className={RANGE_INPUT}
        style={{ zIndex: 25 }}
      />
    </div>
  );
}
