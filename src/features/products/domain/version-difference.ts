type VersionPrice = { slug: string; name: string; salePrice: number | null };

function matches(version: { slug: string; name: string }, key: "fan" | "player"): boolean {
  return version.slug.trim().toLowerCase() === key || version.name.trim().toLowerCase() === key;
}

function findVersion(versions: readonly VersionPrice[], key: "fan" | "player"): VersionPrice | undefined {
  return versions.find((version) => matches(version, key));
}

/** Texto corto de la ficha. No inventa una diferencia de precio. */
export function fanPlayerDifferenceCopy(versions: readonly { slug: string; name: string }[]): string | null {
  const hasFan = versions.some((version) => matches(version, "fan"));
  const hasPlayer = versions.some((version) => matches(version, "player"));
  if (!hasFan || !hasPlayer) return null;
  return "Fan es más holgada, para aficionados. Player es más ajustada y ligera, como la de los jugadores.";
}

/**
 * Precio compartido de Fan y Player, si en los datos es el mismo.
 * La ficha entonces solo explica el corte y no repite el precio en cada botón.
 */
export function sharedFanPlayerPrice(versions: readonly VersionPrice[]): number | null {
  const fan = findVersion(versions, "fan");
  const player = findVersion(versions, "player");
  if (!fan || !player) return null;
  if (fan.salePrice === null || player.salePrice === null) return null;
  if (fan.salePrice !== player.salePrice) return null;
  return fan.salePrice;
}
