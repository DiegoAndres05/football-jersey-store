import "server-only";

import { prisma } from "@/lib/prisma";
import {
  planMissingReservationCancellations,
  type ReservationRow,
} from "../repositories/inventory-plan";
import { lockOrderForUpdate } from "../repositories/order-repository";
import { releaseReservedUsage } from "@/features/coupons/repositories/coupon-repository";
import { decideBoldExpiration } from "@/features/payments/domain/bold-expiration";
import { getBoldTransactionStatus } from "@/features/payments/services/bold-service";
import { reconcileBoldOrder } from "@/features/payments/services/bold-payment-reconcile";
import { getInventoryReservationTtlMinutes } from "./expiration-config";
import { logExpirationBatch, logExpirationFailure, logExpirationResult } from "./expiration-logging";
import type {
  ExpirationBatchOptions,
  ExpirationBatchResult,
  ExpirationOrderResult,
} from "./expiration-types";

const DEFAULT_LIMIT = 100;
const expirationReason = "Liberación de reserva por expiración.";

function emptyResult(orderCode: string, outcome: ExpirationOrderResult["outcome"], error?: string): ExpirationOrderResult {
  return { orderCode, outcome, releasedVariants: 0, releasedUnits: 0, couponReleased: false, ...(error ? { error } : {}) };
}

export async function expireInventoryReservations(
  options: ExpirationBatchOptions = {},
): Promise<ExpirationBatchResult> {
  const now = options.now ?? new Date();
  const ttlMinutes = options.ttlMinutes ?? getInventoryReservationTtlMinutes();
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_LIMIT, 1000));
  const cutoff = new Date(now.getTime() - ttlMinutes * 60_000);

  const rows = await prisma.inventoryMovement.findMany({
    where: { type: "RESERVATION", createdAt: { lte: cutoff }, orderReference: { not: null } },
    orderBy: [{ orderReference: "asc" }, { createdAt: "asc" }],
    take: limit * 10,
    select: { id: true, orderReference: true, createdAt: true },
  });
  const candidates = new Map<string, { ids: string[]; earliest: Date }>();
  for (const row of rows) {
    const code = row.orderReference;
    if (!code) continue;
    const current = candidates.get(code);
    if (current) current.ids.push(row.id);
    else candidates.set(code, { ids: [row.id], earliest: row.createdAt });
    if (candidates.size >= limit && !current) break;
  }

  const results: ExpirationOrderResult[] = [];
  for (const [orderCode, candidate] of candidates) {
    const boldResult = await resolveWithBold(orderCode, now.getTime() - candidate.earliest.getTime());
    if (boldResult) {
      results.push(boldResult);
      logExpirationResult(boldResult);
      continue;
    }
    const result = await expireOneOrder(orderCode, cutoff, now);
    results.push(result);
    logExpirationResult(result);
  }
  const summary: ExpirationBatchResult = {
    expired: results.filter((r) => r.outcome === "expired").length,
    skipped: results.filter((r) => r.outcome === "skipped").length,
    resolved: results.filter((r) => r.outcome === "resolved").length,
    failed: results.filter((r) => r.outcome === "failed").length,
    results,
  };
  logExpirationBatch(summary);
  return summary;
}

/**
 * Sandbox Bold sends no webhooks, so a paid order may still be PENDING_PAYMENT.
 * Returns a result when the order must not be expired in this run, or null to expire it.
 */
async function resolveWithBold(orderCode: string, reservationAgeMs: number): Promise<ExpirationOrderResult | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { code: orderCode },
      select: { status: true, total: true, saleCurrency: true, boldTransaction: { select: { id: true } } },
    });
    if (!order || order.status !== "PENDING_PAYMENT" || !order.boldTransaction) return null;

    const voucher = await getBoldTransactionStatus(orderCode);
    const decision = decideBoldExpiration(voucher?.status ?? null, reservationAgeMs);
    if (decision === "EXPIRE") return null;
    if (decision === "KEEP") return emptyResult(orderCode, "skipped");

    const reconciled = await reconcileBoldOrder({
      orderCode,
      orderTotal: order.total,
      orderCurrency: order.saleCurrency ?? "COP",
    });
    return emptyResult(orderCode, reconciled.apply ? "resolved" : "skipped");
  } catch (error) {
    logExpirationFailure(orderCode, error);
    return emptyResult(orderCode, "failed", "bold lookup failed; retryable");
  }
}

async function expireOneOrder(orderCode: string, cutoff: Date, now: Date): Promise<ExpirationOrderResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const found = await tx.order.findUnique({ where: { code: orderCode }, select: { id: true } });
      if (!found) return emptyResult(orderCode, "skipped");
      const order = await lockOrderForUpdate(tx, found.id);
      if (!order || order.status !== "PENDING_PAYMENT") {
        return emptyResult(orderCode, order ? "resolved" : "skipped");
      }

      const reservations = await tx.inventoryMovement.findMany({
        where: { orderReference: orderCode, type: "RESERVATION" },
        select: { id: true, variantId: true, quantity: true, createdAt: true },
      });
      const expired = reservations.filter((row) => row.createdAt <= cutoff);
      if (expired.length === 0) return emptyResult(orderCode, "skipped");

      const existing = await tx.inventoryMovement.findMany({
        where: { orderReference: orderCode, type: "CANCELLATION" },
        select: { variantId: true, quantity: true },
      });
      const movements = planMissingReservationCancellations(
        reservations as ReservationRow[],
        existing as ReservationRow[],
      );
      if (movements.length > 0) {
        await tx.inventoryMovement.createMany({
          data: movements.map((movement) => ({
            variantId: movement.variantId,
            type: "CANCELLATION",
            quantity: movement.quantity,
            reference: orderCode,
            orderReference: orderCode,
            reason: expirationReason,
            createdAt: now,
          })),
        });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "PENDING_PAYMENT",
          toStatus: "CANCELLED",
          createdAt: now,
          createdBy: "inventory-expiration",
          note: `${expirationReason} Referencia: ${orderCode}.`,
        },
      });
      const released = await releaseReservedUsage(tx, order.id, now, expirationReason);
      return {
        orderCode,
        outcome: "expired",
        releasedVariants: movements.length,
        releasedUnits: movements.reduce((sum, movement) => sum + movement.quantity, 0),
        couponReleased: released.count > 0,
      };
    });
  } catch (error) {
    logExpirationFailure(orderCode, error);
    return emptyResult(orderCode, "failed", "transaction failed; retryable");
  }
}

export type { ExpirationBatchOptions, ExpirationBatchResult, ExpirationOrderResult } from "./expiration-types";
