import { NextResponse } from "next/server";
import { z } from "zod";
import { expireInventoryReservations } from "@/features/orders/services/expire-inventory-reservations";

export const runtime = "nodejs";

const RequestSchema = z.object({
  limit: z.number().int().positive().max(1000).optional(),
  now: z.string().datetime().optional(),
}).strict();

type ExpirationInput = z.infer<typeof RequestSchema>;

// Vercel cron sends `Authorization: Bearer $CRON_SECRET`.
function isAuthorized(request: Request): boolean {
  const secret = process.env.INVENTORY_RESERVATION_CRON_SECRET || process.env.CRON_SECRET;
  const supplied = request.headers.get("x-inventory-expiration-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(secret) && supplied === secret;
}

async function runExpiration(input: ExpirationInput) {
  const summary = await expireInventoryReservations({
    limit: input.limit,
    now: input.now ? new Date(input.now) : undefined,
  });
  return NextResponse.json({
    expired: summary.expired,
    skipped: summary.skipped,
    resolved: summary.resolved,
    failed: summary.failed,
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runExpiration({});
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body is valid */ }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  return runExpiration(parsed.data);
}
