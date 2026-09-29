import { NextResponse } from "next/server";
import { z } from "zod";
import { expireInventoryReservations } from "@/features/orders/services/expire-inventory-reservations";

export const runtime = "nodejs";

const RequestSchema = z.object({
  limit: z.number().int().positive().max(1000).optional(),
  now: z.string().datetime().optional(),
}).strict();

export async function POST(request: Request) {
  const secret = process.env.INVENTORY_RESERVATION_CRON_SECRET;
  const supplied = request.headers.get("x-inventory-expiration-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || supplied !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body is valid */ }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  const summary = await expireInventoryReservations({
    limit: parsed.data.limit,
    now: parsed.data.now ? new Date(parsed.data.now) : undefined,
  });
  return NextResponse.json({
    expired: summary.expired,
    skipped: summary.skipped,
    resolved: summary.resolved,
    failed: summary.failed,
  });
}
