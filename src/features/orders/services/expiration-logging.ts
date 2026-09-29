import type { ExpirationOrderResult, ExpirationBatchResult } from "./expiration-types";

export function logExpirationResult(result: ExpirationOrderResult): void {
  console.info("[inventory-expiration]", {
    orderCode: result.orderCode,
    outcome: result.outcome,
    releasedVariants: result.releasedVariants,
    releasedUnits: result.releasedUnits,
    couponReleased: result.couponReleased,
    error: result.error,
  });
}

export function logExpirationFailure(orderCode: string, error: unknown): void {
  console.error("[inventory-expiration] retryable failure", {
    orderCode,
    error: error instanceof Error ? error.message : "unknown error",
  });
}

export function logExpirationBatch(summary: ExpirationBatchResult): void {
  console.info("[inventory-expiration] batch", {
    expired: summary.expired,
    skipped: summary.skipped,
    resolved: summary.resolved,
    failed: summary.failed,
  });
}
