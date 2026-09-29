const DEFAULT_TTL_MINUTES = 30;

export function getInventoryReservationTtlMinutes(
  value = process.env.INVENTORY_RESERVATION_TTL_MINUTES,
): number {
  if (value == null || value.trim() === "") return DEFAULT_TTL_MINUTES;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_TTL_MINUTES;
  return parsed;
}
