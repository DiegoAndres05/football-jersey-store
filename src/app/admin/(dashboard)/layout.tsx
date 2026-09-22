import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { getSessionUser } from "@/features/auth/server/session";
import { logoutAction } from "@/features/auth/server/actions";
import { isFkaImporterEnabled } from "@/features/import/fka/browser-provider";
import { AdminNavigation } from "./admin-navigation";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";

export const metadata = {
  title: "Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }

  const userEmail = user?.email ?? "";

  const navItems = [
    { href: "/admin", label: "Panel", exact: true },
    { href: "/admin/inventario", label: "Inventario" },
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/cupones", label: "Cupones" },
    { href: "/admin/productos", label: "Productos" },
    { href: "/admin/ligas", label: "Ligas" },
    { href: "/admin/equipos", label: "Equipos" },
    { href: "/admin/proveedores", label: "Proveedores" },
    { href: "/admin/temporadas", label: "Temporadas" },
    { href: "/admin/tallas", label: "Tallas" },
    { href: "/admin/versiones", label: "Versiones" },
    ...(isFkaImporterEnabled() ? [{ href: "/admin/importar", label: "Importar" }] : []),
    { href: "/admin/ajustes", label: "Ajustes" },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <a href="#admin-main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm">
        Saltar al contenido
      </a>
      <div className="container-page py-6">
        <header className="border-b border-border pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Flashsport Admin</p>
              <h1 className="font-display text-xl font-bold uppercase tracking-tight">Administración</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:border-muted-foreground/40 transition-colors">
                Ver tienda <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:border-destructive/40 hover:text-destructive transition-colors">
                  Salir <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="mt-5">
          <AdminNavigation items={navItems} userEmail={userEmail} />
        </div>

        <main id="admin-main-content" className="pt-6">
          <AdminBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
