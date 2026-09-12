import type { Metadata } from "next";

export type CatalogDecision =
  | { action: "index" }
  | { action: "redirect"; destination: string }
  | { action: "noindex" };

const SEO_NOISE_KEYS = new Set([
  "q",
  "sort",
  "talla",
  "disponibilidad",
  "modalidad",
  "temporada",
  "version",
]);

export function decideCatalogIndexation(
  searchParams: Record<string, string | undefined>,
): CatalogDecision {
  const entries = Object.entries(searchParams).filter(
    ([, v]) => v !== undefined && v !== "",
  );

  if (entries.length === 0) {
    return { action: "index" };
  }

  const keys = new Set(entries.map(([k]) => k));
  const hasLiga = keys.has("liga");
  const hasEquipo = keys.has("equipo");

  if (hasLiga && !hasEquipo && entries.length === 1) {
    return { action: "redirect", destination: `/ligas/${entries[0][1]}` };
  }

  if (hasEquipo && !hasLiga && entries.length === 1) {
    return { action: "redirect", destination: `/equipos/${entries[0][1]}` };
  }

  for (const key of keys) {
    if (SEO_NOISE_KEYS.has(key)) {
      return { action: "noindex" };
    }
  }

  const pageVal = searchParams.page;
  if (pageVal !== undefined && pageVal !== "" && pageVal !== "1") {
    return { action: "noindex" };
  }

  if (hasLiga && hasEquipo) {
    return { action: "noindex" };
  }

  return { action: "index" };
}
