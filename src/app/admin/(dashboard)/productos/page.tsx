import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImageIcon, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Productos · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      team: { select: { name: true, league: { select: { name: true } } } },
      _count: { select: { images: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Productos <span className="text-muted-foreground">({products.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestiona las imágenes de cada producto (Supabase Storage).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Equipo / Liga</th>
              <th className="px-4 py-3 text-center font-medium">Imágenes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.team.name}
                  {p.team.league ? ` · ${p.team.league.name}` : ""}
                </td>
                <td className="px-4 py-3 text-center tabular-nums">{p._count.images}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/productos/${p.slug}/imagenes`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40 transition-colors"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Imágenes
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}