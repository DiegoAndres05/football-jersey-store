"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/features/auth/services/password";
import { createSessionCookie, authCookieName } from "@/features/auth/server/session";
import {
  isLoginBlocked,
  registerLoginFailure,
  clearLoginAttempts,
  loginWindowMinutes,
} from "@/features/auth/server/rate-limit";
import {
  STAFF_LOGIN_ERROR,
  STAFF_SESSION_MAX_AGE_SECONDS,
  isAdminRole,
  isStaffAuthCutoverEnabled,
  isStaffRole,
} from "@/features/auth/domain/staff-role";
import { createStaffAuthClient } from "@/lib/supabase/staff-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function legacyCookieOptions() {
  const deployedHttps = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: STAFF_SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production" && deployedHttps,
  };
}

async function loginWithLegacyPassword(email: string, password: string): Promise<{ error: string } | "ok"> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !isAdminRole(user.role)) {
    registerLoginFailure(email);
    return { error: STAFF_LOGIN_ERROR };
  }
  if (!user.passwordHash) {
    return {
      error: "Este administrador aún no tiene contraseña configurada. Ejecuta `npm run admin:password`.",
    };
  }
  if (!verifyPassword(password, user.passwordHash)) {
    registerLoginFailure(email);
    return { error: STAFF_LOGIN_ERROR };
  }
  const cookieStore = await cookies();
  cookieStore.set(authCookieName, createSessionCookie(user), legacyCookieOptions());
  return "ok";
}

export async function loginAction(formData: FormData): Promise<{ error: string } | void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: STAFF_LOGIN_ERROR };

  const email = parsed.data.email.toLowerCase();
  if (isLoginBlocked(email)) {
    return {
      error: `Demasiados intentos fallidos. Espera ${loginWindowMinutes()} minutos e inténtalo de nuevo.`,
    };
  }

  const supabase = await createStaffAuthClient();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });
    if (!error && data.user) {
      let user = await prisma.user.findUnique({ where: { authUserId: data.user.id } });
      if (!user) {
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byEmail && !byEmail.authUserId) {
          user = await prisma.user.update({
            where: { id: byEmail.id },
            data: { authUserId: data.user.id },
          });
        }
      }
      if (!user || !user.isActive || !isStaffRole(user.role)) {
        await supabase.auth.signOut();
        registerLoginFailure(email);
        return { error: STAFF_LOGIN_ERROR };
      }
      clearLoginAttempts(email);
      redirect("/admin");
    }
  }

  if (isStaffAuthCutoverEnabled()) {
    registerLoginFailure(email);
    return { error: STAFF_LOGIN_ERROR };
  }

  const legacy = await loginWithLegacyPassword(email, parsed.data.password);
  if (legacy !== "ok") return legacy;
  clearLoginAttempts(email);
  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createStaffAuthClient();
  if (supabase) await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
  redirect("/admin/login");
}
