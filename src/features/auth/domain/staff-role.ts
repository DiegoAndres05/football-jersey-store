export const STAFF_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
export const STAFF_LOGIN_ERROR = "Correo o contraseña inválidos.";

export function isAdminRole(role: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isVendorRole(role: string): boolean {
  return role === "VENDOR";
}

export function isStaffRole(role: string): boolean {
  return isAdminRole(role) || isVendorRole(role);
}

export function isStaffAuthCutoverEnabled(value = process.env.STAFF_AUTH_CUTOVER): boolean {
  return value === "true";
}

export function isStaffSessionExpired(signedInAtMs: number, nowMs: number): boolean {
  if (!Number.isFinite(signedInAtMs)) return true;
  return nowMs - signedInAtMs > STAFF_SESSION_MAX_AGE_SECONDS * 1000;
}

export function vendorMayOpen(pathname: string): boolean {
  return pathname === "/admin/venta-efectivo"
    || pathname === "/admin/pedidos"
    || pathname.startsWith("/admin/pedidos/");
}

export type StaffChangeInput = {
  actorRole: string;
  targetRole: string;
  targetIsActive: boolean;
  nextRole?: string;
  deactivate?: boolean;
  otherActiveAdmins: number;
};

export function staffChangeAllowed(input: StaffChangeInput): { ok: true } | { ok: false; error: string } {
  if (!isAdminRole(input.actorRole)) return { ok: false, error: "No autorizado." };
  const nextRole = input.nextRole;
  if (nextRole && nextRole !== "ADMIN" && nextRole !== "VENDOR") {
    return { ok: false, error: "El rol no es válido." };
  }
  const removesAdmin = input.targetIsActive && isAdminRole(input.targetRole) && (
    input.deactivate === true || (nextRole !== undefined && !isAdminRole(nextRole))
  );
  if (removesAdmin && input.otherActiveAdmins < 1) {
    return { ok: false, error: "Debe quedar al menos un administrador activo." };
  }
  return { ok: true };
}
