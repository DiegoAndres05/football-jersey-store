/** Etiqueta del filtro de temporada. No duplica «Retro» si el nombre ya lo trae. */
export function seasonFilterLabel(season: { name: string; isRetro: boolean }): string {
  const name = season.name.trim();
  if (!season.isRetro) return name;
  const rest = name.replace(/^retro\b[\s-]*/i, "").trim();
  return rest ? `Retro ${rest}` : "Retro";
}
