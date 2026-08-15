"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/features/auth/services/password";
import { createSessionCookie } from "@/features/auth/server/session";
import {
  isLoginBlocked,
  registerLoginFailure,
  clearLoginAttempts,
  loginWindowMinutes,
} from "@/features/auth/server/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export async function loginAction(formData: FormData): Promise<{ error: string } | void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Correo o contraseña inválidos." };
  }

  const key = parsed.data.email.toLowerCase();
  if (isLoginBlocked(key)) {
    return {
      error: `Demasiados intentos fallidos. Espera ${loginWindowMinutes()} minutos e inténtalo de nuevo.`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: key },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    registerLoginFailure(key);
    return { error: "Correo o contraseña inválidos." };
  }
  if (!user.passwordHash) {
    return {
      error:
        "Este administrador aún no tiene contraseña configurada. Ejecuta `npm run admin:password`.",
    };
  }
  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    registerLoginFailure(key);
    return { error: "Correo o contraseña inválidos." };
  }

  clearLoginAttempts(key);

  const token = createSessionCookie(user);
  const cookieStore = await cookies();
  cookieStore.set("fs_admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("fs_admin_session");
  redirect("/admin/login");
}