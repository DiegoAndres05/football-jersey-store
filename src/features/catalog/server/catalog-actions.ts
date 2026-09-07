"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supabaseServer, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/server";
import { getSessionUser } from "@/features/auth/server/session";
import {
  slugify,
  buildUniqueSku,
  createVariantsForAllSizes,
} from "@/features/catalog/server/variant-service";
import { deleteProductIfAllowed } from "@/features/catalog/server/product-delete";
import { deleteVariantIfAllowed } from "@/features/catalog/server/variant-delete";
import { setProductActiveIfExists } from "@/features/catalog/server/product-visibility";
import { saveError, type AdminSaveResult } from "@/shared/admin/admin-save-result";

/**
 * CRUD de catálogo (FASE 4). Solo admin (cookie firmada).
 * deleteProductAction, deleteVariantAction y setProductActiveAction
 * devuelven AdminSaveResult (nunca lanzan) para que la UI muestre toast.
 */

async function requireAdmin() {
  const admin = await getSessionUser();
  if (!admin) throw new Error("No autorizado.");
}

// ---------------- LIGAS ----------------

const leagueSchema = z.object({
  name: z.string().min(1, "Escribe el nombre.").max(80),
  country: z.string().max(80).optional().nullable(),
  logoUrl: z.string().url("URL inválida.").optional().nullable().or(z.literal("")),
});

const cleanNullable = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export async function createLeagueAction(formData: FormData) {
  await requireAdmin();
  const parsed = leagueSchema.safeParse({
    name: formData.get("name"),
    country: cleanNullable(formData.get("country")),
    logoUrl: cleanNullable(formData.get("logoUrl")),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  const exists = await prisma.league.findUnique({ where: { slug } });
  if (exists) throw new Error("Ya existe una liga con ese nombre.");

  await prisma.league.create({ data: { slug, ...parsed.data } });
  redirect("/admin/ligas");
}

export async function updateLeagueAction(leagueId: string, formData: FormData) {
  await requireAdmin();
  const parsed = leagueSchema.safeParse({
    name: formData.get("name"),
    country: cleanNullable(formData.get("country")),
    logoUrl: cleanNullable(formData.get("logoUrl")),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  const clash = await prisma.league.findFirst({ where: { slug, NOT: { id: leagueId } } });
  if (clash) throw new Error("Ya existe otra liga con ese nombre.");

  await prisma.league.update({ where: { id: leagueId }, data: { slug, ...parsed.data } });
  redirect("/admin/ligas");
}

export async function deleteLeagueAction(leagueId: string) {
  await requireAdmin();
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: { _count: { select: { teams: true } } },
  });
  if (!league) throw new Error("La liga no existe.");
  if (league._count.teams > 0) {
    throw new Error(`No se puede eliminar: tiene ${league._count.teams} equipo(s). Mueve o borra sus equipos primero.`);
  }
  await prisma.league.delete({ where: { id: leagueId } });
  redirect("/admin/ligas");
}

// ---------------- EQUIPOS ----------------

const teamSchema = z.object({
  name: z.string().min(1, "Escribe el nombre.").max(80),
  shortName: z.string().max(24).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  crestUrl: z.string().url("URL inválida.").optional().nullable().or(z.literal("")),
  leagueId: z.string().min(1, "Selecciona la liga."),
});

export async function createTeamAction(formData: FormData) {
  await requireAdmin();
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    shortName: cleanNullable(formData.get("shortName")),
    country: cleanNullable(formData.get("country")),
    crestUrl: cleanNullable(formData.get("crestUrl")),
    leagueId: formData.get("leagueId"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  const exists = await prisma.team.findUnique({ where: { slug } });
  if (exists) throw new Error("Ya existe un equipo con ese nombre.");

  const league = await prisma.league.findUnique({ where: { id: parsed.data.leagueId } });
  if (!league) throw new Error("La liga seleccionada no existe.");

  await prisma.team.create({ data: { slug, ...parsed.data } });
  redirect("/admin/equipos");
}

export async function updateTeamAction(teamId: string, formData: FormData) {
  await requireAdmin();
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    shortName: cleanNullable(formData.get("shortName")),
    country: cleanNullable(formData.get("country")),
    crestUrl: cleanNullable(formData.get("crestUrl")),
    leagueId: formData.get("leagueId"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  const clash = await prisma.team.findFirst({ where: { slug, NOT: { id: teamId } } });
  if (clash) throw new Error("Ya existe otro equipo con ese nombre.");

  await prisma.team.update({ where: { id: teamId }, data: { slug, ...parsed.data } });
  redirect("/admin/equipos");
}

export async function deleteTeamAction(teamId: string) {
  await requireAdmin();
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { products: true } } },
  });
  if (!team) throw new Error("El equipo no existe.");
  if (team._count.products > 0) {
    throw new Error(`No se puede eliminar: tiene ${team._count.products} producto(s).`);
  }
  await prisma.team.delete({ where: { id: teamId } });
  redirect("/admin/equipos");
}

// ---------------- PRODUCTOS ----------------

import { KIT_TYPES } from "@/features/catalog/types/kit-types";

const productSchema = z.object({
  name: z.string().min(1, "Escribe el nombre.").max(120),
  shortName: z.string().max(40).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  kitType: z.enum(KIT_TYPES, "Tipo de camiseta inválido."),
  brand: z.string().max(40).optional().nullable(),
  teamId: z.string().min(1, "Selecciona el equipo."),
  seasonId: z.string().min(1, "Selecciona la temporada."),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  customizationsEnabled: z.boolean(),
  hasPlayerPrint: z.boolean(),
  customizationSurcharge: z.coerce.number().int().min(0, "La personalización no puede ser negativa.").max(100000),
});

const checkbox = (v: FormDataEntryValue | null) => v === "on" || v === "1";

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    shortName: cleanNullable(formData.get("shortName")),
    description: cleanNullable(formData.get("description")),
    kitType: formData.get("kitType"),
    brand: cleanNullable(formData.get("brand")),
    teamId: formData.get("teamId"),
    seasonId: formData.get("seasonId"),
    isFeatured: checkbox(formData.get("isFeatured")),
    isActive: checkbox(formData.get("isActive")),
    customizationsEnabled: checkbox(formData.get("customizationsEnabled")),
    hasPlayerPrint: checkbox(formData.get("hasPlayerPrint")),
    customizationSurcharge: formData.get("customizationSurcharge") ?? "0",
  });
}

async function assertProductRefs(input: { teamId: string; seasonId: string }) {
  const [team, season] = await Promise.all([
    prisma.team.findUnique({ where: { id: input.teamId } }),
    prisma.season.findUnique({ where: { id: input.seasonId } }),
  ]);
  if (!team) throw new Error("El equipo seleccionado no existe.");
  if (!season) throw new Error("La temporada seleccionada no existe.");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  await assertProductRefs(parsed.data);

  const slug = slugify(parsed.data.name);
  if (await prisma.product.findUnique({ where: { slug } })) {
    throw new Error("Ya existe un producto con ese nombre.");
  }

  await prisma.product.create({ data: { slug, ...parsed.data } });
  redirect("/admin/productos");
}

export async function updateProductAction(productId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  await assertProductRefs(parsed.data);

  const slug = slugify(parsed.data.name);
  if (await prisma.product.findFirst({ where: { slug, NOT: { id: productId } } })) {
    throw new Error("Ya existe otro producto con ese nombre.");
  }

  await prisma.product.update({ where: { id: productId }, data: { slug, ...parsed.data } });
  redirect("/admin/productos");
}

export async function deleteProductAction(productId: string): Promise<AdminSaveResult> {
  const admin = await getSessionUser();
  if (!admin) return saveError("No autorizado.");

  const result = await deleteProductIfAllowed(productId, {
    findProduct: (id) =>
      prisma.product.findUnique({
        where: { id },
        include: {
          _count: { select: { variants: true, supplierProducts: true, images: true } },
          images: { select: { id: true, storagePath: true } },
        },
      }),
    removeStorage: async (paths) => {
      await supabaseServer.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
    },
    deleteImages: (id) => prisma.productImage.deleteMany({ where: { productId: id } }).then(() => undefined),
    deleteProduct: (id) => prisma.product.delete({ where: { id } }).then(() => undefined),
  });

  if (result.ok) {
    revalidatePath("/admin/productos");
    revalidatePath("/productos");
  }
  return result;
}

export async function setProductActiveAction(
  productId: string,
  isActive: boolean,
): Promise<AdminSaveResult> {
  const admin = await getSessionUser();
  if (!admin) return saveError("No autorizado.");

  const result = await setProductActiveIfExists(productId, isActive, {
    findProduct: (id) => prisma.product.findUnique({ where: { id }, select: { id: true } }),
    setActive: (id, next) =>
      prisma.product.update({ where: { id }, data: { isActive: next } }).then(() => undefined),
  });

  if (result.ok) {
    revalidatePath("/admin/productos");
    revalidatePath("/productos");
    revalidatePath("/");
  }
  return result;
}

// ---------------- VARIANTES ----------------

const variantSchema = z.object({
  versionId: z.string().min(1, "Selecciona la versión."),
  sizeId: z.string().min(1, "Selecciona la talla."),
  costPrice: z.coerce.number().int().min(0, "El costo no puede ser negativo.").max(100000000),
  salePrice: z.coerce.number().int().min(1, "El precio de venta debe ser mayor a 0.").max(100000000),
  compareAtPrice: z.coerce.number().int().min(0).max(100000000).optional().nullable(),
  lowStockAt: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  weight: z.coerce.number().int().min(1).max(100000).default(400),
  allowsBackorder: z.coerce.boolean().optional(),
});

const variantEditSchema = variantSchema.omit({ versionId: true, sizeId: true });

export async function createVariantAction(productId: string, formData: FormData) {
  await requireAdmin();
  const parsed = variantSchema.safeParse({
    versionId: formData.get("versionId"),
    sizeId: formData.get("sizeId"),
    costPrice: formData.get("costPrice") ?? "0",
    salePrice: formData.get("salePrice"),
    compareAtPrice: cleanNullable(formData.get("compareAtPrice")),
    lowStockAt: cleanNullable(formData.get("lowStockAt")),
    weight: formData.get("weight") ?? "400",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) throw new Error("El producto no existe.");

  const version = await prisma.version.findUnique({ where: { id: parsed.data.versionId } });
  if (!version) throw new Error("La versión seleccionada no existe.");

  // "Todas las tallas": crea una variante por cada talla que aún no exista
  // para esta versión. Las combinaciones ya existentes se omiten.
  if (parsed.data.sizeId === "__ALL__") {
    const sizes = await prisma.size.findMany({
      orderBy: { position: "asc" },
      select: { id: true, code: true },
    });
    if (sizes.length === 0) throw new Error("No hay tallas configuradas.");

    await createVariantsForAllSizes(
      product,
      version,
      sizes,
      {
        costPrice: parsed.data.costPrice,
        salePrice: parsed.data.salePrice,
        compareAtPrice: parsed.data.compareAtPrice ?? null,
        lowStockAt: parsed.data.lowStockAt ?? null,
        weight: parsed.data.weight,
      },
    );

    redirect(`/admin/productos/${product.slug}/variantes`);
  }

  const size = await prisma.size.findUnique({ where: { id: parsed.data.sizeId } });
  if (!size) throw new Error("La talla seleccionada no existe.");

  const clash = await prisma.productVariant.findUnique({
    where: { productId_versionId_sizeId: { productId, versionId: parsed.data.versionId, sizeId: parsed.data.sizeId } },
  });
  if (clash) throw new Error("Esa combinación de versión y talla ya existe para este producto.");

  await prisma.productVariant.create({
    data: {
      productId,
      versionId: parsed.data.versionId,
      sizeId: parsed.data.sizeId,
      sku: await buildUniqueSku(prisma, product, version, size),
      costPrice: parsed.data.costPrice,
      salePrice: parsed.data.salePrice,
      compareAtPrice: parsed.data.compareAtPrice,
      lowStockAt: parsed.data.lowStockAt,
      weight: parsed.data.weight,
    },
  });
  redirect(`/admin/productos/${product.slug}/variantes`);
}

export async function updateVariantAction(variantId: string, formData: FormData) {
  await requireAdmin();
  const parsed = variantEditSchema.safeParse({
    costPrice: formData.get("costPrice") ?? "0",
    salePrice: formData.get("salePrice"),
    compareAtPrice: cleanNullable(formData.get("compareAtPrice")),
    lowStockAt: cleanNullable(formData.get("lowStockAt")),
    weight: formData.get("weight") ?? "400",
    allowsBackorder: formData.get("allowsBackorder"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { slug: true } } },
  });
  if (!variant) throw new Error("La variante no existe.");

  await prisma.productVariant.update({ where: { id: variantId }, data: parsed.data });
  redirect(`/admin/productos/${variant.product.slug}/variantes`);
}

export async function deleteVariantAction(variantId: string): Promise<AdminSaveResult> {
  const admin = await getSessionUser();
  if (!admin) return saveError("No autorizado.");

  const result = await deleteVariantIfAllowed(variantId, {
    findVariant: async (id) => {
      const variant = await prisma.productVariant.findUnique({
        where: { id },
        include: { product: { select: { slug: true } } },
      });
      if (!variant) return null;
      const movementCount = await prisma.inventoryMovement.count({ where: { variantId: id } });
      return { id: variant.id, productSlug: variant.product.slug, movementCount };
    },
    deleteVariant: (id) => prisma.productVariant.delete({ where: { id } }).then(() => undefined),
  });

  if (result.ok) {
    revalidatePath(`/admin/productos/${result.productSlug}/variantes`);
    revalidatePath("/admin/productos");
    return { ok: true };
  }
  return result;
}

export async function adjustStockAction(variantId: string, formData: FormData) {
  await requireAdmin();
  const qty = z.coerce.number().int().safeParse(formData.get("quantity"));
  if (!qty.success || qty.data === 0) throw new Error("La cantidad debe ser un entero distinto de 0.");
  const reason = typeof formData.get("reason") === "string" && formData.get("reason")!.toString().trim()
    ? (formData.get("reason") as string).trim()
    : null;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { slug: true } } },
  });
  if (!variant) throw new Error("La variante no existe.");

  const current = await prisma.inventoryMovement.aggregate({
    where: { variantId },
    _sum: { quantity: true },
  });
  const stock = current._sum.quantity ?? 0;
  if (stock + qty.data < 0) {
    throw new Error(`Stock insuficiente: quedan ${stock} y se intentan restar ${Math.abs(qty.data)}.`);
  }

  const admin = (await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { email: true } }))?.email ?? null;
  await prisma.inventoryMovement.create({
    data: {
      variantId,
      type: "ADJUSTMENT",
      quantity: qty.data,
      adjustmentDirection: qty.data > 0 ? "INCREMENT" : "DECREMENT",
      reason,
      userReference: admin,
    },
  });
  redirect(`/admin/productos/${variant.product.slug}/variantes`);
}

// ---------------- PROVEEDORES ----------------

const supplierSchema = z.object({
  name: z.string().min(1, "Escribe el nombre.").max(120),
  contactName: z.string().max(120).optional().nullable(),
  email: z.string().email("Correo inválido.").optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  leadTimeDays: z.coerce.number().int().min(0, "El lead time no puede ser negativo.").max(365).default(15),
  priority: z.coerce.number().int().min(0).max(10).default(0),
  isActive: z.boolean(),
  purchaseNotes: z.string().max(500).optional().nullable(),
});

function parseSupplierForm(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get("name"),
    contactName: cleanNullable(formData.get("contactName")),
    email: cleanNullable(formData.get("email")),
    phone: cleanNullable(formData.get("phone")),
    country: cleanNullable(formData.get("country")),
    leadTimeDays: formData.get("leadTimeDays") ?? "15",
    priority: formData.get("priority") ?? "0",
    isActive: checkbox(formData.get("isActive")),
    purchaseNotes: cleanNullable(formData.get("purchaseNotes")),
  });
}

export async function createSupplierAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseSupplierForm(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  if (await prisma.supplier.findUnique({ where: { slug } })) {
    throw new Error("Ya existe un proveedor con ese nombre.");
  }

  await prisma.supplier.create({ data: { slug, ...parsed.data } });
  redirect("/admin/proveedores");
}

export async function updateSupplierAction(supplierId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseSupplierForm(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  if (await prisma.supplier.findFirst({ where: { slug, NOT: { id: supplierId } } })) {
    throw new Error("Ya existe otro proveedor con ese nombre.");
  }

  await prisma.supplier.update({ where: { id: supplierId }, data: { slug, ...parsed.data } });
  redirect("/admin/proveedores");
}

export async function deleteSupplierAction(supplierId: string) {
  await requireAdmin();
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: { _count: { select: { products: true } } },
  });
  if (!supplier) throw new Error("El proveedor no existe.");
  if (supplier._count.products > 0) {
    throw new Error(`No se puede eliminar: tiene ${supplier._count.products} producto(s) asignado(s). Desasigna primero.`);
  }
  await prisma.supplier.delete({ where: { id: supplierId } });
  redirect("/admin/proveedores");
}

export async function addSupplierProductAction(supplierId: string, formData: FormData) {
  await requireAdmin();
  const productId = formData.get("productId");
  const costPrice = z.coerce
    .number()
    .int()
    .min(0, "El costo no puede ser negativo.")
    .max(100000000)
    .safeParse(formData.get("costPrice") ?? "0");
  if (!productId || typeof productId !== "string") throw new Error("Selecciona el producto.");
  if (!costPrice.success) throw new Error(costPrice.error.issues[0].message);

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { slug: true },
  });
  if (!supplier) throw new Error("El proveedor no existe.");
  if (!(await prisma.product.findUnique({ where: { id: productId } }))) {
    throw new Error("El producto seleccionado no existe.");
  }

  const clash = await prisma.supplierProduct.findUnique({
    where: { supplierId_productId: { supplierId, productId } },
  });
  if (clash) throw new Error("Ese producto ya está asignado a este proveedor.");

  await prisma.supplierProduct.create({
    data: { supplierId, productId, costPrice: costPrice.data, notes: null },
  });
  redirect(`/admin/proveedores/${supplier.slug}/productos`);
}

export async function updateSupplierProductAction(supplierProductId: string, formData: FormData) {
  await requireAdmin();
  const costPrice = z.coerce
    .number()
    .int()
    .min(0, "El costo no puede ser negativo.")
    .max(100000000)
    .safeParse(formData.get("costPrice") ?? "0");
  if (!costPrice.success) throw new Error(costPrice.error.issues[0].message);

  const sp = await prisma.supplierProduct.findUnique({
    where: { id: supplierProductId },
    include: { supplier: { select: { slug: true } } },
  });
  if (!sp) throw new Error("La asignación no existe.");

  await prisma.supplierProduct.update({
    where: { id: supplierProductId },
    data: { costPrice: costPrice.data, isAvailable: checkbox(formData.get("isAvailable")) },
  });
  redirect(`/admin/proveedores/${sp.supplier.slug}/productos`);
}

export async function removeSupplierProductAction(supplierProductId: string) {
  await requireAdmin();
  const sp = await prisma.supplierProduct.findUnique({
    where: { id: supplierProductId },
    include: { supplier: { select: { slug: true } } },
  });
  if (!sp) throw new Error("La asignación no existe.");

  await prisma.supplierProduct.delete({ where: { id: supplierProductId } });
  redirect(`/admin/proveedores/${sp.supplier.slug}/productos`);
}

// ---------------- TEMPORADAS ----------------

const seasonSchema = z.object({
  name: z.string().min(1, "Escribe el nombre.").max(80),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  isRetro: z.boolean(),
});

export async function createSeasonAction(formData: FormData) {
  await requireAdmin();
  const parsed = seasonSchema.safeParse({
    name: formData.get("name"),
    year: cleanNullable(formData.get("year")),
    isRetro: checkbox(formData.get("isRetro")),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  if (await prisma.season.findUnique({ where: { slug } })) {
    throw new Error("Ya existe una temporada con ese nombre.");
  }

  await prisma.season.create({ data: { slug, ...parsed.data } });
  redirect("/admin/temporadas");
}

export async function updateSeasonAction(seasonId: string, formData: FormData) {
  await requireAdmin();
  const parsed = seasonSchema.safeParse({
    name: formData.get("name"),
    year: cleanNullable(formData.get("year")),
    isRetro: checkbox(formData.get("isRetro")),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  if (await prisma.season.findFirst({ where: { slug, NOT: { id: seasonId } } })) {
    throw new Error("Ya existe otra temporada con ese nombre.");
  }

  await prisma.season.update({ where: { id: seasonId }, data: { slug, ...parsed.data } });
  redirect("/admin/temporadas");
}

export async function deleteSeasonAction(seasonId: string) {
  await requireAdmin();
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: { _count: { select: { products: true } } },
  });
  if (!season) throw new Error("La temporada no existe.");
  if (season._count.products > 0) {
    throw new Error(`No se puede eliminar: tiene ${season._count.products} producto(s). Mueve sus productos primero.`);
  }
  await prisma.season.delete({ where: { id: seasonId } });
  redirect("/admin/temporadas");
}

// ---------------- TALLAS ----------------

const sizeSchema = z.object({
  code: z.string().min(1, "Escribe el código.").max(12),
  name: z.string().min(1, "Escribe el nombre.").max(40),
  position: z.coerce.number().int().min(0).max(100).default(0),
});

export async function createSizeAction(formData: FormData) {
  await requireAdmin();
  const parsed = sizeSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    position: formData.get("position") ?? "0",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const code = parsed.data.code.trim().toUpperCase();
  if (await prisma.size.findUnique({ where: { code } })) {
    throw new Error("Ya existe una talla con ese código.");
  }

  await prisma.size.create({ data: { code, name: parsed.data.name, position: parsed.data.position } });
  redirect("/admin/tallas");
}

export async function updateSizeAction(sizeId: string, formData: FormData) {
  await requireAdmin();
  const parsed = sizeSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    position: formData.get("position") ?? "0",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const code = parsed.data.code.trim().toUpperCase();
  if (await prisma.size.findFirst({ where: { code, NOT: { id: sizeId } } })) {
    throw new Error("Ya existe otra talla con ese código.");
  }

  await prisma.size.update({ where: { id: sizeId }, data: { ...parsed.data, code } });
  redirect("/admin/tallas");
}

export async function deleteSizeAction(sizeId: string) {
  await requireAdmin();
  const size = await prisma.size.findUnique({
    where: { id: sizeId },
    include: { _count: { select: { variants: true } } },
  });
  if (!size) throw new Error("La talla no existe.");
  if (size._count.variants > 0) {
    throw new Error(`No se puede eliminar: tiene ${size._count.variants} variante(s).`);
  }
  await prisma.size.delete({ where: { id: sizeId } });
  redirect("/admin/tallas");
}

// ---------------- VERSIONES ----------------

const versionSchema = z.object({
  name: z.string().min(1, "Escribe el nombre.").max(80),
  priceAdjustment: z.coerce.number().int().min(0).max(1000000).default(0),
});

export async function createVersionAction(formData: FormData) {
  await requireAdmin();
  const parsed = versionSchema.safeParse({
    name: formData.get("name"),
    priceAdjustment: formData.get("priceAdjustment") ?? "0",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  if (await prisma.version.findUnique({ where: { slug } })) {
    throw new Error("Ya existe una versión con ese nombre.");
  }

  await prisma.version.create({ data: { slug, ...parsed.data } });
  redirect("/admin/versiones");
}

export async function updateVersionAction(versionId: string, formData: FormData) {
  await requireAdmin();
  const parsed = versionSchema.safeParse({
    name: formData.get("name"),
    priceAdjustment: formData.get("priceAdjustment") ?? "0",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  if (await prisma.version.findFirst({ where: { slug, NOT: { id: versionId } } })) {
    throw new Error("Ya existe otra versión con ese nombre.");
  }

  await prisma.version.update({ where: { id: versionId }, data: { slug, ...parsed.data } });
  redirect("/admin/versiones");
}

export async function deleteVersionAction(versionId: string) {
  await requireAdmin();
  const version = await prisma.version.findUnique({
    where: { id: versionId },
    include: { _count: { select: { variants: true } } },
  });
  if (!version) throw new Error("La versión no existe.");
  if (version._count.variants > 0) {
    throw new Error(`No se puede eliminar: tiene ${version._count.variants} variante(s).`);
  }
  await prisma.version.delete({ where: { id: versionId } });
  redirect("/admin/versiones");
}