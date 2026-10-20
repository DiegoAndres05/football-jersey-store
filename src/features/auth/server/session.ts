import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import {
  STAFF_SESSION_MAX_AGE_SECONDS,
  isAdminRole,
  isStaffAuthCutoverEnabled,
  isStaffRole,
  isStaffSessionExpired,
} from "@/features/auth/domain/staff-role";
import { createStaffAuthClient } from "@/lib/supabase/staff-auth";

const COOKIE_NAME = "fs_admin_session";

type SessionPayload = { email: string; role: string; issuedAt: number };

function sign(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = process.env.NEXTAUTH_SECRET ?? "";
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
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  if (!secret) return null;
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

async function userFromLegacyCookie(): Promise<User | null> {
  if (isStaffAuthCutoverEnabled()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload || !isAdminRole(payload.role)) return null;
  if (isStaffSessionExpired(payload.issuedAt, Date.now())) return null;
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user || !user.isActive || !isAdminRole(user.role)) return null;
  return user;
}

type SupabaseStaffResult =
  | { state: "missing" }
  | { state: "rejected" }
  | { state: "user"; user: User };

async function userFromSupabase(): Promise<SupabaseStaffResult> {
  const supabase = await createStaffAuthClient();
  if (!supabase) return { state: "missing" };
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;
  if (!authUser) return { state: "missing" };
  const signedInAt = Date.parse(authUser.last_sign_in_at ?? "");
  if (isStaffSessionExpired(signedInAt, Date.now())) {
    await supabase.auth.signOut();
    return { state: "rejected" };
  }
  const email = authUser.email?.toLowerCase();
  let user = await prisma.user.findUnique({ where: { authUserId: authUser.id } });
  if (!user && email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail && !byEmail.authUserId) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { authUserId: authUser.id },
      });
    } else if (byEmail?.authUserId === authUser.id) {
      user = byEmail;
    }
  }
  if (!user || !user.isActive || !isStaffRole(user.role)) {
    await supabase.auth.signOut();
    return { state: "rejected" };
  }
  return { state: "user", user };
}

/** Personal activo: administrador o vendedor. */
export async function getStaffUser(): Promise<User | null> {
  const supabaseUser = await userFromSupabase();
  if (supabaseUser.state === "user") return supabaseUser.user;
  if (supabaseUser.state === "rejected") return null;
  return userFromLegacyCookie();
}

/** Administrador activo. Las mutaciones existentes del panel siguen exigiendo este rol. */
export async function getSessionUser(): Promise<User | null> {
  const user = await getStaffUser();
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

export const authCookieName = COOKIE_NAME;
