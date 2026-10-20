"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/server/session";
import { isAdminRole, staffChangeAllowed } from "@/features/auth/domain/staff-role";
import { supabaseServer } from "@/lib/supabase/server";

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  role: z.enum(["ADMIN", "VENDOR"]),
});

async function requireAdmin() {
  const actor = await getSessionUser();
  if (!actor || !isAdminRole(actor.role)) return null;
  return actor;
}

function otherActiveAdmins(activeAdmins: number, targetIsActiveAdmin: boolean): number {
  return activeAdmins - (targetIsActiveAdmin ? 1 : 0);
}

export async function inviteStaffAction(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const actor = await requireAdmin();
  if (!actor) return { error: "No autorizado." };
  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Revisa el nombre, el correo y el rol." };
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con ese correo." };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.flashsports.shop";
  const invited = await supabaseServer.auth.admin.inviteUserByEmail(email, {
    data: { name: parsed.data.name },
    redirectTo: `${site}/admin/login`,
  });
  if (invited.error || !invited.data.user) {
    return { error: "No pudimos enviar la invitación. Revisa el correo e inténtalo de nuevo." };
  }

  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      role: parsed.data.role,
      isActive: true,
      authUserId: invited.data.user.id,
      passwordHash: null,
    },
  });
  return { ok: true };
}

export async function changeStaffRoleAction(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const actor = await requireAdmin();
  if (!actor) return { error: "No autorizado." };
  const userId = String(formData.get("userId") ?? "");
  const nextRole = String(formData.get("role") ?? "");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "No encontramos a esa persona." };
  const activeAdmins = await prisma.user.count({
    where: { isActive: true, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });
  const decision = staffChangeAllowed({
    actorRole: actor.role,
    targetRole: target.role,
    targetIsActive: target.isActive,
    nextRole,
    otherActiveAdmins: otherActiveAdmins(activeAdmins, target.isActive && isAdminRole(target.role)),
  });
  if (!decision.ok) return decision;
  await prisma.user.update({ where: { id: target.id }, data: { role: nextRole } });
  return { ok: true };
}

export async function deactivateStaffAction(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const actor = await requireAdmin();
  if (!actor) return { error: "No autorizado." };
  const userId = String(formData.get("userId") ?? "");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "No encontramos a esa persona." };
  if (target.id === actor.id) return { error: "No puedes desactivar tu propia cuenta." };
  const activeAdmins = await prisma.user.count({
    where: { isActive: true, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });
  const decision = staffChangeAllowed({
    actorRole: actor.role,
    targetRole: target.role,
    targetIsActive: target.isActive,
    deactivate: true,
    otherActiveAdmins: otherActiveAdmins(activeAdmins, target.isActive && isAdminRole(target.role)),
  });
  if (!decision.ok) return decision;
  await prisma.user.update({ where: { id: target.id }, data: { isActive: false } });
  if (target.authUserId) {
    await supabaseServer.auth.admin.updateUserById(target.authUserId, { ban_duration: "876000h" });
  }
  return { ok: true };
}
