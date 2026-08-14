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