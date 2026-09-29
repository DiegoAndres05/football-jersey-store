export type ExpiredReservationCandidate = {
  orderCode: string;
  reservationIds: string[];
  earliestExpiredAt: Date;
};

export type ExpirationOrderResult = {
  orderCode: string;
  outcome: "expired" | "skipped" | "resolved" | "failed";
  releasedVariants: number;
  releasedUnits: number;
  couponReleased: boolean;
  error?: string;
};

export type ExpirationBatchOptions = {
  now?: Date;
  ttlMinutes?: number;
  limit?: number;
};

export type ExpirationBatchResult = {
  expired: number;
  skipped: number;
  resolved: number;
  failed: number;
  results: ExpirationOrderResult[];
};
