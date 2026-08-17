import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "@/features/catalog/server/catalog-actions";
import { getSuppliers } from "@/features/catalog/server/reference-cache";

export const metadata: Metadata = {
  title: "Proveedores · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Proveedores <span className="text-muted-foreground">({suppliers.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea y edita proveedores. No se puede eliminar un proveedor con productos asignados.
        </p>
      </div>

      <form
        action={createSupplierAction}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nuevo proveedor
        </p>
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            name="name"
            placeholder="Nombre (ej: Proveedor Asia)"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            name="contactName"
            placeholder="Contacto"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-40"
          />
          <input
            name="email"
            type="email"
            placeholder="Correo"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-52"
          />
          <input
            name="phone"
            placeholder="Teléfono"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36"
          />
          <input
            name="country"
            placeholder="País"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-32"
          />
          <input
            name="leadTimeDays"
            type="number"
            min={0}
            defaultValue={15}
            placeholder="Lead time (días)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-32"
          />
          <input
            name="priority"
            type="number"
            min={0}
            max={10}
            defaultValue={0}
            placeholder="Prioridad"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-24"
          />
          <label className="flex items-center gap-1 text-sm text-muted-foreground">
            <input type="checkbox" name="isActive" defaultChecked className="accent-primary" /> Activo
          </label>
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))]"
          >
            Crear
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Contacto / País</th>
              <th className="px-4 py-3 text-center font-medium">Productos</th>
              <th className="px-4 py-3 text-center font-medium">Lead (días)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-b-0 align-top">
                <td className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    {s.name}
                    {!s.isActive && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[s.contactName, s.country].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3 text-center tabular-nums">{s._count.products}</td>
                <td className="px-4 py-3 text-center tabular-nums">{s.leadTimeDays}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <form action={updateSupplierAction.bind(null, s.id)} className="flex flex-wrap items-center gap-2">
                      <input name="name" defaultValue={s.name} className="h-7 w-32 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="contactName" defaultValue={s.contactName ?? ""} placeholder="Contacto" className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="email" defaultValue={s.email ?? ""} placeholder="Email" className="h-7 w-32 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="phone" defaultValue={s.phone ?? ""} placeholder="Tel" className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="country" defaultValue={s.country ?? ""} placeholder="País" className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs" />
                      <input name="leadTimeDays" type="number" min={0} defaultValue={s.leadTimeDays} className="h-7 w-14 rounded-md border border-input bg-background px-2 text-xs" title="Lead días" />
                      <input name="priority" type="number" min={0} max={10} defaultValue={s.priority} className="h-7 w-12 rounded-md border border-input bg-background px-2 text-xs" title="Prioridad" />
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input type="checkbox" name="isActive" defaultChecked={s.isActive} className="accent-primary" /> Activo
                      </label>
                      <input name="purchaseNotes" defaultValue={s.purchaseNotes ?? ""} placeholder="Notas" className="hidden" />
                      <button type="submit" className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors">
                        Guardar
                      </button>
                    </form>
                    <Link
                      href={`/admin/proveedores/${s.slug}/productos`}
                      className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors"
                    >
                      Productos <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                    <form action={deleteSupplierAction.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Eliminar
                      </button>
                    </form>
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