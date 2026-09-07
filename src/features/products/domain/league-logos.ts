export const BIG_LEAGUE_SLUGS = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
] as const;

export type BigLeagueSlug = (typeof BIG_LEAGUE_SLUGS)[number];

const LEAGUE_LOGO_SRC: Record<BigLeagueSlug, string> = {
  "premier-league": "/leagues/premier_league.png",
  "la-liga": "/leagues/la_liga.png",
  "serie-a": "/leagues/serie_a.png",
  bundesliga: "/leagues/bundesliga.png",
  "ligue-1": "/leagues/ligue_1.png",
};

const LEAGUE_MONOGRAMS: Record<BigLeagueSlug, string> = {
  "premier-league": "PL",
  "la-liga": "LAL",
  "serie-a": "SA",
  bundesliga: "BL",
  "ligue-1": "L1",
};

export function leagueLogoSrc(slug: string): string | null {
  if (slug in LEAGUE_LOGO_SRC) {
    return LEAGUE_LOGO_SRC[slug as BigLeagueSlug];
  }
  return null;
}

export function leagueMonogram(slug: string, fallbackName?: string): string {
  if (slug in LEAGUE_MONOGRAMS) {
    return LEAGUE_MONOGRAMS[slug as BigLeagueSlug];
  }
  return (fallbackName ?? slug).slice(0, 3).toUpperCase();
}
