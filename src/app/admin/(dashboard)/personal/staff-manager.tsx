"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeStaffRoleAction, deactivateStaffAction, inviteStaffAction } from "@/features/auth/server/staff-actions";

export type StaffRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
};

function roleLabel(role: string): string {
  if (role === "VENDOR") return "Vendedor";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "Administrador";
  return role;
}

export function StaffManager({ staff }: { staff: StaffRow[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function invite(formData: FormData) {
    setPending(true);
    setMessage("");
    const result = await inviteStaffAction(formData);
    setMessage("error" in result ? result.error : "Invitación enviada. La persona define su contraseña desde el correo.");
    setPending(false);
    if ("ok" in result) router.refresh();
  }

  async function changeRole(formData: FormData) {
    setPending(true);
    setMessage("");
    const result = await changeStaffRoleAction(formData);
    setMessage("error" in result ? result.error : "Rol actualizado.");
    setPending(false);
    if ("ok" in result) router.refresh();
  }

  async function deactivate(formData: FormData) {
    setPending(true);
    setMessage("");
    const result = await deactivateStaffAction(formData);
    setMessage("error" in result ? result.error : "Cuenta desactivada.");
    setPending(false);
    if ("ok" in result) router.refresh();
  }

  return (
    <div className="space-y-8">
      <form action={invite} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="staff-name">Nombre</Label>
          <Input id="staff-name" name="name" required maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-email">Correo</Label>
          <Input id="staff-email" name="email" type="email" required maxLength={160} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-role">Rol</Label>
          <select id="staff-role" name="role" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" defaultValue="VENDOR">
            <option value="VENDOR">Vendedor</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>Invitar</Button>
        </div>
      </form>
      {message ? <p className="text-sm">{message}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((person) => (
              <tr key={person.id} className="border-b border-border last:border-0">
                <td className="p-3">{person.name?.trim() || "—"}</td>
                <td className="p-3">{person.email}</td>
                <td className="p-3">{roleLabel(person.role)}</td>
                <td className="p-3">{person.isActive ? "Activo" : "Inactivo"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={changeRole} className="flex gap-2">
                      <input type="hidden" name="userId" value={person.id} />
                      <select name="role" defaultValue={person.role === "VENDOR" ? "VENDOR" : "ADMIN"} className="h-9 rounded-md border border-border bg-background px-2 text-sm" aria-label={`Rol de ${person.email}`}>
                        <option value="VENDOR">Vendedor</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                      <Button type="submit" variant="outline" disabled={pending || !person.isActive}>Guardar rol</Button>
                    </form>
                    {person.isActive ? (
                      <form action={deactivate}>
                        <input type="hidden" name="userId" value={person.id} />
                        <Button type="submit" variant="outline" disabled={pending}>Desactivar</Button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
