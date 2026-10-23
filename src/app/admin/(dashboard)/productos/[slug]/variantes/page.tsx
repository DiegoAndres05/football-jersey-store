import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  createVariantAction,
  updateAllVariantsAction,
  adjustStockAction,
  setProductStockAction,
} from "@/features/catalog/server/catalog-actions";
import { AdminPendingNotice, AdminSubmitButton } from "@/features/catalog/components/admin-form-status";
import { VariantDeleteButton } from "@/features/catalog/components/variant-delete-button";
import { getVersions, getSizes } from "@/features/catalog/server/reference-cache";
import { stockStatusLabel } from "../../../admin-ui-formatters";

export const metadata: Metadata = {
  title: "Variantes · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductVariantsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      team: { select: { name: true } },
      variants: { include: { version: true, size: true }, orderBy: [{ size: { position: "asc" } }, { version: { name: "asc" } }] },
    },
  });
  if (!product) notFound();

  const [versions, sizes] = await Promise.all([getVersions(), getSizes()]);

  const movements = await prisma.inventoryMovement.groupBy({
    by: ["variantId"],
    where: { variantId: { in: product.variants.map((v) => v.id) } },
    _sum: { quantity: true },
    _count: { _all: true },
  });
  const stockByVariant = new Map(movements.map((m) => [m.variantId, m._sum.quantity ?? 0]));
  const movementCountByVariant = new Map(movements.map((m) => [m.variantId, m._count._all]));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Volver a productos
        </Link>
        <h2 className="mt-1 font-display text-lg font-bold uppercase tracking-tight">
          Variantes · {product.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {product.team.name} · el stock se calcula como la suma del ledger. Una variante con
          movimientos de inventario no se puede borrar.
        </p>
      </div>

      <form
        action={createVariantAction.bind(null, product.id)}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <AdminPendingNotice label="Creando las tallas" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nueva variante
        </p>
        <div className="flex flex-col lg:flex-row gap-3">
          <select name="versionId" required defaultValue="" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-40">
            <option value="" disabled>Versión…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <select name="sizeId" required defaultValue="" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-40">
            <option value="" disabled>Talla…</option>
            <option value="__ALL__">Todas las tallas</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input name="costPrice" type="number" min={0} placeholder="Costo (COP)" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-32" />
          <input name="salePrice" type="number" min={1} placeholder="Precio venta (COP)" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36" />
          <input name="compareAtPrice" type="number" min={0} placeholder="Precio tachado" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-32" />
          <input name="lowStockAt" type="number" min={0} placeholder="Alerta stock ≤" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-28" />
          <input name="initialStock" type="number" min={0} placeholder="Cantidad en cada talla" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-44" />
          <AdminSubmitButton label="Crear" pendingLabel="Creando…" className="rounded-xl bg-primary px-4 h-10 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-60" />
        </div>
      </form>

      {product.variants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Este producto no tiene variantes todavía.
        </p>
      ) : (
        <>
          <form
            action={setProductStockAction.bind(null, product.id)}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <AdminPendingNotice label="Aplicando la cantidad" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Misma cantidad en todas las tallas
            </p>
            <p className="text-sm text-muted-foreground">
              Escribe cuántas unidades debe tener cada talla. Las que ya tienen otra cantidad se ajustan solas.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select name="versionId" defaultValue="" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-48">
                <option value="">Todas las versiones</option>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>{version.name}</option>
                ))}
              </select>
              <input name="quantity" type="number" min={0} required placeholder="Cantidad" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-36" />
              <AdminSubmitButton label="Aplicar" pendingLabel="Aplicando…" className="rounded-xl bg-primary px-4 h-10 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-60" />
            </div>
          </form>
          <form id="bulk-variants-form" action={updateAllVariantsAction.bind(null, product.id)}>
            <AdminPendingNotice label="Guardando precios" />
            {product.variants.map((v) => (
              <input key={v.id} form="bulk-variants-form" type="hidden" name="variantId" value={v.id} />
            ))}
            <div className="mb-3 flex justify-end">
              <AdminSubmitButton
                label="Guardar precios"
                pendingLabel="Guardando…"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-60"
              />
            </div>
          </form>
        <div className="space-y-3">
              {product.variants.map((v) => {
                const stock = stockByVariant.get(v.id) ?? 0;
                const movementCount = movementCountByVariant.get(v.id) ?? 0;
                const low = v.lowStockAt !== null && stock <= v.lowStockAt;
                const status = stock <= 0 ? "AGOTADO" : low ? "STOCK_BAJO" : v.allowsBackorder ? "BAJO_PEDIDO" : "DISPONIBLE";
                const inputClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
                return (
                  <article key={v.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{v.size.name} · {v.version.name}</p>
                        <code className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-xs">{v.sku}</code>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold tabular-nums ${low ? "text-destructive" : ""}`}>{stock}</p>
                        <p className="text-xs font-medium">{stockStatusLabel(status)}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <label className="text-xs text-muted-foreground">Costo
                        <input form="bulk-variants-form" name={`variant.${v.id}.costPrice`} type="number" min={0} defaultValue={v.costPrice} className={`mt-1 ${inputClass}`} />
                      </label>
                      <label className="text-xs text-muted-foreground">Venta
                        <input form="bulk-variants-form" name={`variant.${v.id}.salePrice`} type="number" min={1} defaultValue={v.salePrice} className={`mt-1 ${inputClass}`} />
                      </label>
                      <label className="text-xs text-muted-foreground">Tachado
                        <input form="bulk-variants-form" name={`variant.${v.id}.compareAtPrice`} type="number" min={0} defaultValue={v.compareAtPrice ?? ""} className={`mt-1 ${inputClass}`} />
                      </label>
                      <label className="text-xs text-muted-foreground">Alerta
                        <input form="bulk-variants-form" name={`variant.${v.id}.lowStockAt`} type="number" min={0} defaultValue={v.lowStockAt ?? ""} className={`mt-1 ${inputClass}`} />
                      </label>
                      <label className="text-xs text-muted-foreground">Peso (g)
                        <input form="bulk-variants-form" name={`variant.${v.id}.weight`} type="number" min={1} defaultValue={v.weight} className={`mt-1 ${inputClass}`} />
                      </label>
                      <label className="flex items-end gap-2 pb-2 text-sm">
                        <input form="bulk-variants-form" name={`variant.${v.id}.allowsBackorder`} type="checkbox" defaultChecked={v.allowsBackorder} className="h-4 w-4 accent-primary" />
                        Bajo pedido
                      </label>
                    </div>
                    <form action={adjustStockAction.bind(null, v.id)} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <AdminPendingNotice label="Ajustando el stock" />
                      <input name="quantity" type="number" required placeholder="Sumar o restar" className={inputClass} />
                      <input name="reason" placeholder="Motivo" className={inputClass} />
                      <AdminSubmitButton label="Ajustar" pendingLabel="Ajustando…" className="h-10 rounded-xl border border-border px-4 text-sm hover:border-foreground/30 disabled:opacity-60" />
                    </form>
                    <div className="mt-3">
                      <VariantDeleteButton
                        variantId={v.id}
                        label={`${v.size.name} · ${v.version.name}`}
                        movementCount={movementCount}
                      />
                    </div>
                  </article>
                );
              })}
        </div>
        </>
      )}
    </div>
  );
}