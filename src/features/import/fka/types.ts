export const FKA_KIT_TYPES = ["LOCAL", "VISITANTE", "TERCERA"] as const;
export type FkaKitType = (typeof FKA_KIT_TYPES)[number];

export type FkaTeamContext = {
  leagueName: string | null;
  leagueUrl?: string | null;
  country?: string | null;
};

export type FkaKit = {
  source: "football-kit-archive";
  title: string;
  team: string;
  season: string;
  type: FkaKitType;
  leagueName: string | null;
  leagueUrl?: string | null;
  country?: string | null;
  imageUrl: string | null;
  sourceUrl: string;
};

export type ImportStatus = "ENCONTRADO" | "SIN_EQUIPO" | "SIN_TEMPORADA" | "DUPLICADO" | "ERROR";

export type ImportPreviewItem = {
  kit: FkaKit;
  status: ImportStatus;
  teamMatch: { found: boolean; name: string | null };
  seasonMatch: { found: boolean; name: string | null };
  message: string | null;
  /**
   * Miniatura para el preview: data URL descargada con la sesión CDP de FKA.
   * Opcional: si no se descargó, la UI cae al imageUrl original de FKA.
   */
  previewImage?: string | null;
};

export type FkaSearchInput = {
  teams: string[];
  season: string;
  types: FkaKitType[];
};