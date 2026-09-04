/**
 * Conversión entera de COP a USD (céntimos).
 * Fórmula: half-up rounding, mínimo 1 ¢ si COP > 0.
 *
 * usdCents = trunc((amountCop * 100 + floor(copPerUsd / 2)) / copPerUsd)
 * Si amountCop > 0 y usdCents === 0 → usdCents = 1
 */

export function toUsdCents(amountCop: number, copPerUsd: number): number {
  if (amountCop <= 0) return 0;
  if (copPerUsd <= 0) return 0;

  const usdCents = Math.trunc((amountCop * 100 + Math.floor(copPerUsd / 2)) / copPerUsd);

  // Mínimo representable: si COP > 0, siempre al menos 1 cent
  return usdCents > 0 ? usdCents : 1;
}
