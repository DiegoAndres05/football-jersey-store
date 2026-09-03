import type { Availability } from "../types/product-types";
import { FAN_SIZE_GUIDE, PLAYER_SIZE_GUIDE, type MeasurementProfile, type SizeCandidate, type SizeGuideKind, type SizeRecommendation } from "../types/size-guide-types";
type AvailableVariant = { sizeCode: string; availability: Availability };
const distanceToRange = (value: number, min: number, max: number) => value < min ? min - value : value > max ? value - max : 0;

export function recommendSize(kind: SizeGuideKind, profile: MeasurementProfile, variants: AvailableVariant[] = []): SizeRecommendation {
  const table = kind === "FAN" ? FAN_SIZE_GUIDE : PLAYER_SIZE_GUIDE;
  const candidates: SizeCandidate[] = table.rows.filter((row) => profile.heightCm >= row.heightMin - 1 && profile.heightCm <= row.heightMax + 1).map((row) => ({ ...row, heightMatch: true, weightMatch: profile.weightKg >= row.weightMin && profile.weightKg <= row.weightMax, weightDistance: distanceToRange(profile.weightKg, row.weightMin, row.weightMax) }));
  const available = new Set(variants.filter((variant) => variant.availability !== "OUT_OF_STOCK").map((variant) => variant.sizeCode));
  if (!candidates.length) return { status: "NO_MATCH", availablePrimary: false, reason: kind === "PLAYER" ? "No hay datos suficientes para recomendar esta talla Player. Revisa las tallas disponibles." : "No encontramos una coincidencia clara en la tabla. Revisa las tallas disponibles.", candidates };
  const weightMatches = candidates.filter((candidate) => candidate.weightMatch);
  const ranked = [...(weightMatches.length ? weightMatches : candidates)].sort((a, b) => a.weightDistance - b.weightDistance);
  const primary = ranked[0];
  const alternative = ranked[1];
  const primaryAvailable = variants.length === 0 || available.has(primary.sizeCode);
  const ambiguous = !weightMatches.length && Boolean(alternative);
  const status = primaryAvailable ? ambiguous ? "AMBIGUOUS" : "RECOMMENDED" : "UNAVAILABLE";
  const reason = !primaryAvailable ? `La talla ${primary.sizeCode} coincide con tus medidas, pero no está disponible en esta versión. Revisa las tallas comprables.` : ambiguous ? `La talla ${primary.sizeCode} es la orientación principal; ${alternative?.sizeCode} también es cercana porque el peso no define una única talla.` : `La talla ${primary.sizeCode} coincide con tus medidas. Es una orientación, no una garantía de ajuste.`;
  return { status, primarySize: primary.sizeCode, alternativeSize: ambiguous ? alternative?.sizeCode : undefined, availablePrimary: primaryAvailable, reason, candidates, garmentMeasurements: primary.measurements };
}