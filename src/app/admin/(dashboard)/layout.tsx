import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, ImageIcon, Trophy, Shield, Truck, Calendar, Ruler, Layers, Download, ExternalLink, LogOut } from "lucide-react";
import { getSessionUser } from "@/features/auth/server/session";
import { logoutAction } from "@/features/auth/server/actions";

export const metadata: Metadata = {
  title: "Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const navItems = [
    { href: "/admin", label: "Panel", icon: LayoutDashboard },
    { href: "/admin/inventario", label: "Inventario", icon: Package },
    { href: "/admin/productos", label: "Productos", icon: ImageIcon },
    { href: "/admin/ligas", label: "Ligas", icon: Trophy },
    { href: "/admin/equipos", label: "Equipos", icon: Shield },
    { href: "/admin/proveedores", label: "Proveedores", icon: Truck },
    { href: "/admin/temporadas", label: "Temporadas", icon: Calendar },
    { href: "/admin/tallas", label: "Tallas", icon: Ruler },
    { href: "/admin/versiones", label: "Versiones", icon: Layers },
    { href: "/admin/importar", label: "Importar", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container-page py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Flashsport Admin</p>
            <h1 className="font-display text-xl font-bold uppercase tracking-tight">Administración</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40 transition-colors"
            >
              Ver tienda <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:border-destructive/40 hover:text-destructive transition-colors"
              >
                Salir <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>

        <nav className="flex gap-1 mt-4 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}