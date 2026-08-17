import type { FkaKit, FkaKitType, ImportStatus } from "./types.ts";
import { normalizeTeamName, seasonSlug, seasonToYear } from "./normalizer.ts";

export type DbTeam = { id: string; name: string };
export type DbSeason = { id: string; name: string; slug: string; year: number | null };
export type DbProduct = { id: string; teamId: string; seasonId: string; kitType: string };

export function resolveTeam(teams: DbTeam[], fkaTeam: string): DbTeam | null {
  const key = normalizeTeamName(fkaTeam);
  if (!key) return null;
  return teams.find((t) => normalizeTeamName(t.name) === key) ?? null;
}

export function resolveSeason(seasons: DbSeason[], fkaSeason: string): DbSeason | null {
  const year = seasonToYear(fkaSeason);
  if (year) {
    const byYear = seasons.find((s) => s.year === year);
    if (byYear) return byYear;
  }
  const slug = seasonSlug(fkaSeason);
  if (slug) {
    const bySlug = seasons.find((s) => s.slug === slug);
    if (bySlug) return bySlug;
  }
  return seasons.find((s) => s.name === fkaSeason) ?? null;
}

export function isDuplicate(
  products: DbProduct[],
  teamId: string,
  seasonId: string,
  kitType: FkaKitType,
): boolean {
  return products.some(
    (p) => p.teamId === teamId && p.seasonId === seasonId && p.kitType === kitType,
  );
}

export type ImportResolution = {
  status: ImportStatus;
  teamId: string | null;
  seasonId: string | null;
  teamFound: boolean;
  seasonFound: boolean;
};

export function resolveImport(
  kit: Pick<FkaKit, "team" | "season" | "type">,
  teams: DbTeam[],
  seasons: DbSeason[],
  products: DbProduct[],
): ImportResolution {
  const team = resolveTeam(teams, kit.team);
  if (!team) {
    return { status: "SIN_EQUIPO", teamId: null, seasonId: null, teamFound: false, seasonFound: false };
  }
  const season = resolveSeason(seasons, kit.season);
  if (!season) {
    return { status: "SIN_TEMPORADA", teamId: team.id, seasonId: null, teamFound: true, seasonFound: false };
  }
  const duplicate = isDuplicate(products, team.id, season.id, kit.type);
  if (duplicate) {
    return { status: "DUPLICADO", teamId: team.id, seasonId: season.id, teamFound: true, seasonFound: true };
  }
  return { status: "ENCONTRADO", teamId: team.id, seasonId: season.id, teamFound: true, seasonFound: true };
}