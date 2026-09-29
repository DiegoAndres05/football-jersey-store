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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-secondary/30 md:grid md:grid-cols-[13rem_minmax(0,1fr)]">
      <a href="#admin-main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm">
        Saltar al contenido
      </a>
      <div className="contents">
        <aside className="hidden border-r border-border px-4 py-5 md:sticky md:top-0 md:flex md:h-full md:min-h-0 md:flex-col">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Flashsport Admin</p>
            <h1 className="mt-1 font-display text-xl font-bold uppercase tracking-tight">Administración</h1>
          </div>
          <div className="mt-5 border-y border-border py-4">
            <p className="truncate text-xs text-muted-foreground" title={userEmail}>{userEmail}</p>
            <div className="mt-3 grid gap-2">
              <Link href="/" className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-muted-foreground/40">
                Ver tienda
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="inline-flex w-full items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-destructive/40 hover:text-destructive">
                  Salir
                </button>
              </form>
            </div>
          </div>
          <div className="mt-5 min-h-0 overflow-y-auto">
            <AdminNavigation items={navItems} userEmail={userEmail} />
          </div>
        </aside>

        <header className="shrink-0 border-b border-border px-4 py-4 md:hidden">
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

        <div className="shrink-0 px-4 pt-4 md:hidden">
          <AdminNavigation items={navItems} userEmail={userEmail} />
        </div>

        <main id="admin-main-content" className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-5 md:px-6 md:pt-6 lg:px-8">
          <AdminBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
