import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

const COOKIE_NAME = "fs_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

type SessionPayload = { email: string; role: string; issuedAt: number };

function sign(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = process.env.NEXTAUTH_SECRET ?? "local-dev-secret-change-me-in-production-please";
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function createSessionCookie(user: Pick<User, "email" | "role">): string {
  const payload: SessionPayload = { email: user.email, role: user.role, issuedAt: Date.now() };
  return sign(payload);
}

function verify(token: string): SessionPayload | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const secret = process.env.NEXTAUTH_SECRET ?? "local-dev-secret-change-me-in-production-please";
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verify(token);
  if (!payload || payload.role !== "ADMIN") return null;
  if (Date.now() - payload.issuedAt > MAX_AGE_SECONDS * 1000) return null;

  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user || !user.isActive || user.role !== "ADMIN") return null;
  return user;
}

export const authCookieName = COOKIE_NAME;