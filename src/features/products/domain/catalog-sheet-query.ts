export type PriceBounds = { min: number; max: number };

export type SheetDraft = {
  league: string;
  team: string;
  season: string;
  version: string;
  size: string;
  availability: string;
  deliveryMode: string;
  minPrice: number;
  maxPrice: number;
};

const MANAGED_KEYS = [
  "liga",
  "equipo",
  "temporada",
  "version",
  "talla",
  "disponibilidad",
  "modalidad",
  "precioMin",
  "precioMax",
  "page",
] as const;

export function priceSliderStep(min: number, max: number): number {
  const span = Math.max(0, max - min);
  if (span <= 20_000) return 1_000;
  if (span <= 100_000) return 5_000;
  if (span <= 400_000) return 10_000;
  return 20_000;
}

/** El extremo del slider cuenta como “sin filtro” si está a menos de un paso del límite. */
export function priceIsAtBound(value: number, bound: number, step: number): boolean {
  return Math.abs(value - bound) < step;
}

export function snapPrice(value: number, bounds: PriceBounds): number {
  if (bounds.max <= bounds.min) return bounds.min;
  const step = priceSliderStep(bounds.min, bounds.max);
  if (priceIsAtBound(value, bounds.min, step)) return bounds.min;
  if (priceIsAtBound(value, bounds.max, step)) return bounds.max;
  const steps = Math.round((value - bounds.min) / step);
  return Math.min(bounds.max, Math.max(bounds.min, bounds.min + steps * step));
}

/** Misma selección de filtros, sin importar el orden ni la página. */
export function sheetQueriesMatch(current: string, href: string): boolean {
  const next = href.includes("?") ? href.slice(href.indexOf("?") + 1) : "";
  const left = new URLSearchParams(current);
  const right = new URLSearchParams(next);
  left.delete("page");
  right.delete("page");
  const keys = new Set([...left.keys(), ...right.keys()]);
  for (const key of keys) {
    if ((left.get(key) ?? "") !== (right.get(key) ?? "")) return false;
  }
  return true;
}

export function emptySheetDraft(bounds: PriceBounds): SheetDraft {
  return {
    league: "",
    team: "",
    season: "",
    version: "",
    size: "",
    availability: "",
    deliveryMode: "",
    minPrice: bounds.min,
    maxPrice: bounds.max,
  };
}

function clampPrice(value: number, bounds: PriceBounds): number {
  if (!Number.isFinite(value)) return bounds.min;
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(value)));
}

export function sheetDraftFromSearch(current: string, bounds: PriceBounds): SheetDraft {
  const params = new URLSearchParams(current);
  const hasMin = params.has("precioMin");
  const hasMax = params.has("precioMax");
  const minPrice = hasMin ? clampPrice(Number(params.get("precioMin")), bounds) : bounds.min;
  const maxPrice = hasMax ? clampPrice(Number(params.get("precioMax")), bounds) : bounds.max;
  const low = snapPrice(Math.min(minPrice, maxPrice), bounds);
  const high = snapPrice(Math.max(minPrice, maxPrice), bounds);
  const league = params.get("liga") ?? "";
  return {
    league,
    team: league ? (params.get("equipo") ?? "") : "",
    season: params.get("temporada") ?? "",
    version: params.get("version") ?? "",
    size: params.get("talla") ?? "",
    availability: params.get("disponibilidad") ?? "",
    deliveryMode: params.get("modalidad") ?? "",
    minPrice: low,
    maxPrice: high,
  };
}

export function countSheetFilters(draft: SheetDraft, bounds: PriceBounds): number {
  let count = 0;
  if (draft.size) count += 1;
  if (draft.version) count += 1;
  if (draft.deliveryMode) count += 1;
  if (draft.availability) count += 1;
  if (draft.league) count += 1;
  if (draft.league && draft.team) count += 1;
  if (draft.season) count += 1;
  if (isPriceNarrowed(draft, bounds)) count += 1;
  return count;
}

export function isPriceNarrowed(draft: SheetDraft, bounds: PriceBounds): boolean {
  if (bounds.max <= bounds.min) return false;
  const step = priceSliderStep(bounds.min, bounds.max);
  return (
    !priceIsAtBound(draft.minPrice, bounds.min, step) ||
    !priceIsAtBound(draft.maxPrice, bounds.max, step)
  );
}

export function applySheetDraft(
  pathname: string,
  current: string,
  draft: SheetDraft,
  bounds: PriceBounds,
): string {
  const params = new URLSearchParams(current);
  for (const key of MANAGED_KEYS) params.delete(key);
  if (draft.league) params.set("liga", draft.league);
  if (draft.league && draft.team) params.set("equipo", draft.team);
  if (draft.season) params.set("temporada", draft.season);
  if (draft.version) params.set("version", draft.version);
  if (draft.size) params.set("talla", draft.size);
  if (draft.availability === "AVAILABLE" || draft.availability === "OUT_OF_STOCK") {
    params.set("disponibilidad", draft.availability);
  }
  if (draft.deliveryMode === "INMEDIATA" || draft.deliveryMode === "BAJO_PEDIDO") {
    params.set("modalidad", draft.deliveryMode);
  }
  if (bounds.max > bounds.min) {
    const step = priceSliderStep(bounds.min, bounds.max);
    if (!priceIsAtBound(draft.minPrice, bounds.min, step)) {
      params.set("precioMin", String(Math.round(draft.minPrice)));
    }
    if (!priceIsAtBound(draft.maxPrice, bounds.max, step)) {
      params.set("precioMax", String(Math.round(draft.maxPrice)));
    }
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
