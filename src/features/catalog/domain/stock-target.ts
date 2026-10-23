/** Diferencia para dejar el stock en la cantidad pedida. Null si ya está en esa cantidad. */
export function stockAdjustment(current: number, target: number): number | null {
  const delta = target - current;
  return delta === 0 ? null : delta;
}
