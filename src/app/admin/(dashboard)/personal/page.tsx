import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/server/session";
import { StaffManager } from "./staff-manager";

export default async function StaffPage() {
  const admin = await getSessionUser();
  if (!admin) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Personal</h2>
        <p className="mt-2 text-sm text-muted-foreground">No autorizado.</p>
      </div>
    );
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN", "VENDOR"] } },
    select: { id: true, name: true, email: true, role: true, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Personal</h2>
        <p className="text-sm text-muted-foreground">Invita trabajadores y asigna administrador o vendedor. La contraseña la define cada persona desde el correo.</p>
      </div>
      <StaffManager staff={staff} />
    </div>
  );
}
