import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImageIcon, ArrowRight } from "lucide-react";
import {
  assignSizesToAllProductsAction,
  createProductAction,
  updateAllProductsAction,
} from "@/features/catalog/server/catalog-actions";
import { ProductDeleteButton } from "@/features/catalog/components/product-delete-button";
import { ProductVisibilityButton } from "@/features/catalog/components/product-visibility-button";
import { ActivateAllProductsButton } from "@/features/catalog/components/activate-all-products-button";
import { AdminPendingNotice, AdminSubmitButton } from "@/features/catalog/components/admin-form-status";
import { KIT_TYPES } from "@/features/catalog/types/kit-types";
import { getTeams, getSeasons, getVersions, getSizes } from "@/features/catalog/server/reference-cache";
import { HomepageCarouselPicker } from "@/features/products/components/homepage-carousel-picker";
import {
  getHomepageCarouselImageIds,
  listEligibleCarouselPhotos,
} from "@/features/products/repositories/homepage-carousel-repository";

export const metadata: Metadata = {
  title: "Productos · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ tallas?: string }>;
}) {
  const assignedSizes = Number((await searchParams).tallas);
  const [products, teams, seasons, versions, sizes, carouselPhotos, selectedCarouselIds] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        team: { select: { name: true, league: { select: { name: true } } } },
        _count: { select: { images: true, variants: true, supplierProducts: true } },
      },
    }),
    getTeams(),
    getSeasons(),
    getVersions(),
    getSizes(),
    listEligibleCarouselPhotos(),
    getHomepageCarouselImageIds(),
  ]);

  const fieldClass = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
  const hiddenCount = products.filter((product) => !product.isActive).length;

  const productInputs = (p: (typeof products)[number]) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs text-muted-foreground sm:col-span-2">
        Nombre
        <input name={`product.${p.id}.name`} defaultValue={p.name} required className={fieldClass} />
      </label>
      <label className="text-xs text-muted-foreground">
        Abreviatura
        <input name={`product.${p.id}.shortName`} defaultValue={p.shortName ?? ""} className={fieldClass} />
      </label>
      <label className="text-xs text-muted-foreground">
        Equipo
        <select name={`product.${p.id}.teamId`} defaultValue={p.teamId} className={fieldClass}>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted-foreground">
        Temporada
        <select name={`product.${p.id}.seasonId`} defaultValue={p.seasonId} className={fieldClass}>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.year ?? s.name}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted-foreground">
        Tipo
        <select name={`product.${p.id}.kitType`} defaultValue={p.kitType} className={fieldClass}>
          {KIT_TYPES.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted-foreground">
        Marca
        <input name={`product.${p.id}.brand`} defaultValue={p.brand ?? ""} className={fieldClass} />
      </label>
      <label className="text-xs text-muted-foreground">
        Recargo personalización
        <input name={`product.${p.id}.customizationSurcharge`} type="number" min={0} defaultValue={p.customizationSurcharge} className={fieldClass} />
      </label>
      <div className="flex flex-wrap items-end gap-4 pb-2 sm:col-span-2 xl:col-span-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={`product.${p.id}.isFeatured`} defaultChecked={p.isFeatured} className="h-4 w-4 accent-primary" /> Destacado
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={`product.${p.id}.isActive`} defaultChecked={p.isActive} className="h-4 w-4 accent-primary" /> Activo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={`product.${p.id}.customizationsEnabled`} defaultChecked={p.customizationsEnabled} className="h-4 w-4 accent-primary" /> Personalización
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={`product.${p.id}.hasPlayerPrint`} defaultChecked={p.hasPlayerPrint} className="h-4 w-4 accent-primary" /> Dorsal
        </label>
      </div>
      <input name={`product.${p.id}.description`} defaultValue={p.description ?? ""} className="hidden" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Productos <span className="text-muted-foreground">({products.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea y edita productos. Si tiene variantes, proveedores o imágenes no se puede borrar: usa
          «Ocultar de la tienda» para que deje de venderse. El historial de stock se conserva.
        </p>
      </div>

      <HomepageCarouselPicker
        photos={carouselPhotos}
        initialSelectedIds={selectedCarouselIds}
      />

      {hiddenCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {hiddenCount === 1 ? "Hay 1 producto oculto." : `Hay ${hiddenCount} productos ocultos.`} Puedes mostrarlos todos de una vez.
          </p>
          <ActivateAllProductsButton count={hiddenCount} />
        </div>
      )}

      <form
        action={createProductAction}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
      >
        <AdminPendingNotice label="Creando el producto" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nuevo producto
        </p>
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            name="name"
            placeholder="Nombre (ej: Real Madrid 25/26 Local)"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <select
            name="teamId"
            required
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-44"
          >
            <option value="" disabled>Equipo…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            name="seasonId"
            required
            defaultValue=""
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36"
          >
            <option value="" disabled>Temporada…</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.year ?? s.name}</option>
            ))}
          </select>
          <select name="kitType" defaultValue="LOCAL" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36">
            {KIT_TYPES.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            name="brand"
            placeholder="Marca (ej: Adidas)"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-36"
          />
          <AdminSubmitButton label="Crear" pendingLabel="Creando…" className="rounded-xl bg-primary px-4 h-10 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-60" />
        </div>
      </form>

      <form action={assignSizesToAllProductsAction} className="space-y-4 rounded-xl border border-border bg-card p-5">
        <AdminPendingNotice label="Asignando las tallas" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tallas para todas las camisetas
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Asigna las mismas tallas a todo el catálogo, sin abrir cada camiseta. Si una camiseta ya tiene esa talla en la versión elegida, se deja como está.
          </p>
        </div>
        {Number.isInteger(assignedSizes) && assignedSizes >= 0 && (
          <p className="rounded-lg bg-secondary px-3 py-2 text-sm" role="status">
            {assignedSizes === 0
              ? "Todas las camisetas ya tenían esas tallas."
              : `Se agregaron ${assignedSizes} tallas. Las que ya existían no se modificaron.`}
          </p>
        )}
        {sizes.length === 0 || versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Primero crea versiones y tallas en el menú del panel.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs text-muted-foreground">
                Versión
                <select name="versionId" required defaultValue="" className={fieldClass}>
                  <option value="" disabled>Versión…</option>
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>{version.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Precio de venta
                <input name="salePrice" type="number" min={1} required placeholder="COP" className={fieldClass} />
              </label>
              <label className="text-xs text-muted-foreground">
                Precio tachado
                <input name="compareAtPrice" type="number" min={0} placeholder="Opcional" className={fieldClass} />
              </label>
              <label className="text-xs text-muted-foreground">
                Cantidad inicial
                <input name="initialStock" type="number" min={0} placeholder="Opcional" className={fieldClass} />
              </label>
            </div>
            <fieldset>
              <legend className="text-xs text-muted-foreground">Tallas</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <label key={size.id} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-3 text-sm">
                    <input name="sizeId" type="checkbox" value={size.id} defaultChecked className="h-4 w-4 accent-primary" />
                    {size.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <AdminSubmitButton
              label="Asignar a todas"
              pendingLabel="Asignando…"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-60"
            />
          </>
        )}
      </form>

      <form action={updateAllProductsAction} className="space-y-4">
        <AdminPendingNotice label="Guardando los productos" />
        <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">Edición de productos</p>
          <AdminSubmitButton
            label="Guardar todo"
            pendingLabel="Guardando…"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-60"
          />
        </div>
        {products.map((p) => (
          <input key={`id-${p.id}`} type="hidden" name="productId" value={p.id} />
        ))}
        <div className="space-y-4">
          {products.map((p) => (
            <article key={p.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium">
                    {p.name}
                    {!p.isActive && (
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Oculto
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.team.name}
                    {p.team.league ? ` · ${p.team.league.name}` : ""}
                    {" · "}
                    {p._count.images} imagen{p._count.images === 1 ? "" : "es"}
                    {" · "}
                    {p._count.variants} variante{p._count.variants === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/productos/${p.slug}/imagenes`}
                    className="inline-flex h-10 items-center rounded-md border border-border px-3 text-xs hover:border-muted-foreground/40"
                  >
                    <ImageIcon className="mr-1 h-3.5 w-3.5" /> Imágenes
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/admin/productos/${p.slug}/variantes`}
                    className="inline-flex h-10 items-center rounded-md border border-border px-3 text-xs hover:border-muted-foreground/40"
                  >
                    Tallas y stock
                  </Link>
                  <ProductVisibilityButton
                    productId={p.id}
                    productName={p.name}
                    isActive={p.isActive}
                  />
                  <ProductDeleteButton
                    productId={p.id}
                    productName={p.name}
                    counts={{
                      variants: p._count.variants,
                      suppliers: p._count.supplierProducts,
                      images: p._count.images,
                    }}
                  />
                </div>
              </div>
              <div className="mt-4">{productInputs(p)}</div>
            </article>
          ))}
        </div>
      </form>
    </div>
  );
}