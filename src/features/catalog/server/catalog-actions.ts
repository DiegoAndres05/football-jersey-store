"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/server/session";

/**
 * CRUD de catálogo (FASE 4). Solo admin (cookie firmada).
 * Los errores de negocio se propagan como Error con mensaje amigable
 * y se muestran en el error.tsx de cada ruta.
 */

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "sin-nombre"
  );
}

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

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      _count: { select: { variants: true, supplierProducts: true } },
    },
  });
  if (!product) throw new Error("El producto no existe.");
  const razones: string[] = [];
  if (product._count.variants > 0) razones.push(`${product._count.variants} variante(s)`);
  if (product._count.supplierProducts > 0) razones.push(`${product._count.supplierProducts} proveedor(es)`);
  if (razones.length) {
    throw new Error(`No se puede eliminar: tiene ${razones.join(" y ")}. Elimina primero sus variantes.`);
  }
  if ((await prisma.productImage.count({ where: { productId } })) > 0) {
    throw new Error("No se puede eliminar: tiene imágenes. Elimínalas primero.");
  }
  await prisma.product.delete({ where: { id: productId } });
  redirect("/admin/productos");
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
});

const variantEditSchema = variantSchema.omit({ versionId: true, sizeId: true });

async function variantSku(product: { slug: string }, version: { slug: string }, size: { code: string }) {
  const base = slugify(`${product.slug}-${version.slug}-${size.code}`);
  let sku = base;
  let i = 2;
  while (await prisma.productVariant.findUnique({ where: { sku } })) {
    sku = `${base}-${i++}`;
  }
  return sku;
}

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

  const [version, size] = await Promise.all([
    prisma.version.findUnique({ where: { id: parsed.data.versionId } }),
    prisma.size.findUnique({ where: { id: parsed.data.sizeId } }),
  ]);
  if (!version) throw new Error("La versión seleccionada no existe.");
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
      sku: await variantSku(product, version, size),
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

export async function deleteVariantAction(variantId: string) {
  await requireAdmin();
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { slug: true } } },
  });
  if (!variant) throw new Error("La variante no existe.");
  const movements = await prisma.inventoryMovement.count({ where: { variantId } });
  if (movements > 0) {
    throw new Error(
      `No se puede eliminar: tiene ${movements} movimiento(s) de inventario. Conserva el histórico.`,
    );
  }
  await prisma.productVariant.delete({ where: { id: variantId } });
  redirect(`/admin/productos/${variant.product.slug}/variantes`);
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