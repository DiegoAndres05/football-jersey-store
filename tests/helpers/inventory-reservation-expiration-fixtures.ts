export function fixedClock(value = "2026-01-01T12:00:00.000Z"): Date {
  return new Date(value);
}

export function reservationFixture(
  variantId: string,
  quantity: number,
  createdAt = fixedClock(),
) {
  return { variantId, quantity: -Math.abs(quantity), createdAt };
}

export function expirationCutoff(now: Date, ttlMinutes = 30): Date {
  return new Date(now.getTime() - ttlMinutes * 60_000);
}
