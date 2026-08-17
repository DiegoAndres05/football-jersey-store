import { createHash } from "node:crypto";
import type { FkaKit, FkaKitType } from "../fka/types.ts";
import { resolveSeason, resolveTeam } from "../fka/resolver.ts";
import type { DbProduct, DbSeason, DbTeam } from "../fka/resolver.ts";
import { normalizeSeason } from "../fka/normalizer.ts";

/**
 * Lógica pura de importación MVP de camisetas FKA como productos BORRADOR.
 * Sin dependencias de infraestructura (prisma/Supabase): el store y el
 * gateway de imágenes se inyectan, lo que permite testearla sin BD real.
 *
 * Por cada kit seleccionado:
 *  1. Resuelve Team y Season contra la BD (sin crearlos).
 *  2. Deduplica por teamId + seasonId + kitType.
 *  3. Crea Product con isActive=false.
 *  4. Descarga la imagen de FKA y la sube a Supabase Storage.
 *  5. Crea ProductImage (url pública de Supabase + storagePath).
 *
 * Rollback: si la imagen falla, se borra el Product recién creado.
 * No crea variantes, tallas, precios ni stock.
 */

export type FkaImportResultItem = {
  title: string;
  team: string;
  season: string;
  type: FkaKitType;
  status: "IMPORTADO" | "DUPLICADO" | "SIN_TEMPORADA" | "SIN_EQUIPO" | "ERROR";
  productId: string | null;
  slug: string | null;
  message: string | null;
};

export type FkaImportSummary = {
  imported: number;
  duplicated: number;
  sinTemporada: number;
  errors: number;
  sinEquipo: number;
};

export type FkaImportResult = {
  items: FkaImportResultItem[];
  summary: FkaImportSummary;
};

export type ImportStore = {
  slugExists(slug: string): Promise<boolean>;
  createProduct(data: {
    slug: string;
    name: string;
    kitType: FkaKitType;
    teamId: string;
    seasonId: string;
    isActive: boolean;
  }): Promise<{ id: string; slug: string }>;
  deleteProduct(id: string): Promise<void>;
  createImage(data: {
    productId: string;
    url: string;
    altText: string;
    storagePath: string;
  }): Promise<{ id: string }>;
  removeImage(storagePath: string): Promise<void>;
};

export type ImageGateway = {
  download(url: string): Promise<{ buffer: Uint8Array; extension: string }>;
  upload(storagePath: string, buffer: Uint8Array, mime: string): Promise<void>;
  remove(storagePath: string): Promise<void>;
  publicUrl(storagePath: string): string;
};

export function slugifyImport(input: string): string {
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

export function fkaImageStoragePath(productId: string, imageUrl: string, extension: string): string {
  const hash = createHash("sha256").update(imageUrl).digest("hex").slice(0, 12);
  return `products/${productId}/fka-${hash}.${extension}`;
}

export function extensionToMime(extension: string): string {
  return extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
}

export type SeasonCreateData = { slug: string; name: string; year: number | null };

/**
 * Datos para crear una temporada a partir de la cadena FKA (ej. "2026-27"),
 * con el mismo formato que usa el modelo Season en la BD
 * (slug "26-27", name "Temporada 26/27", year 2026). null si no se puede derivar.
 */
export function seasonToCreateData(fkaSeason: string): SeasonCreateData | null {
  const norm = normalizeSeason(fkaSeason);
  if (!norm) return null;
  const year = Number(norm.slice(0, 4));
  const start = norm.slice(2, 4);
  const end = norm.slice(5, 7);
  return { slug: `${start}-${end}`, name: `Temporada ${start}/${end}`, year };
}

/**
 * Temporadas (normalizadas, ej. "2026-27") que faltan en la BD para los kits
 * cuyo equipo SÍ se encontró. Solo considera kits con equipo resuelto; si el
 * equipo no existe no se sugiere crear temporada.
 */
export function missingSeasons(kits: FkaKit[], dbTeams: DbTeam[], dbSeasons: DbSeason[]): string[] {
  const missing = new Set<string>();
  for (const kit of kits) {
    const team = resolveTeam(dbTeams, kit.team);
    if (!team) continue;
    const season = resolveSeason(dbSeasons, kit.season);
    if (!season) {
      const norm = normalizeSeason(kit.season);
      if (norm) missing.add(norm);
    }
  }
  return Array.from(missing);
}

export async function importFkaKitsAsDrafts(
  kits: FkaKit[],
  dbTeams: DbTeam[],
  dbSeasons: DbSeason[],
  dbProducts: DbProduct[],
  store: ImportStore,
  images: ImageGateway,
): Promise<FkaImportResult> {
  const items: FkaImportResultItem[] = [];
  const summary: FkaImportSummary = { imported: 0, duplicated: 0, sinTemporada: 0, errors: 0, sinEquipo: 0 };
  const seenInBatch = new Set<string>();

  for (const kit of kits) {
    const team = resolveTeam(dbTeams, kit.team);
    if (!team) {
      summary.sinEquipo += 1;
      items.push({
        title: kit.title,
        team: kit.team,
        season: kit.season,
        type: kit.type,
        status: "SIN_EQUIPO",
        productId: null,
        slug: null,
        message: `El equipo "${kit.team}" no existe en Flashsport. Créalo desde Administración.`,
      });
      continue;
    }

    const season = resolveSeason(dbSeasons, kit.season);
    if (!season) {
      summary.sinTemporada += 1;
      items.push({
        title: kit.title,
        team: kit.team,
        season: kit.season,
        type: kit.type,
        status: "SIN_TEMPORADA",
        productId: null,
        slug: null,
        message: `La temporada ${kit.season} no existe en Flashsport. Créala primero desde Administración.`,
      });
      continue;
    }

    const batchKey = `${team.id}|${season.id}|${kit.type}`;
    const duplicate =
      seenInBatch.has(batchKey) ||
      dbProducts.some(
        (p) => p.teamId === team.id && p.seasonId === season.id && p.kitType === kit.type,
      );
    if (duplicate) {
      summary.duplicated += 1;
      items.push({
        title: kit.title,
        team: kit.team,
        season: kit.season,
        type: kit.type,
        status: "DUPLICADO",
        productId: null,
        slug: null,
        message: "Ya existe un producto con ese equipo, temporada y tipo.",
      });
      continue;
    }
    seenInBatch.add(batchKey);

    let createdProductId: string | null = null;
    let uploadedPath: string | null = null;
    try {
      const baseSlug = slugifyImport(kit.title);
      let slug = baseSlug;
      let attempt = 2;
      while (await store.slugExists(slug)) {
        slug = `${baseSlug}-${attempt++}`;
      }

      const product = await store.createProduct({
        slug,
        name: kit.title,
        kitType: kit.type,
        teamId: team.id,
        seasonId: season.id,
        isActive: false,
      });
      createdProductId = product.id;

      if (kit.imageUrl) {
        const { buffer, extension } = await images.download(kit.imageUrl);
        const storagePath = fkaImageStoragePath(product.id, kit.imageUrl, extension);
        await images.upload(storagePath, buffer, extensionToMime(extension));
        uploadedPath = storagePath;
        await store.createImage({
          productId: product.id,
          url: images.publicUrl(storagePath),
          altText: kit.title,
          storagePath,
        });
      }

      summary.imported += 1;
      items.push({
        title: kit.title,
        team: kit.team,
        season: kit.season,
        type: kit.type,
        status: "IMPORTADO",
        productId: product.id,
        slug: product.slug,
        message: null,
      });
    } catch (err) {
      if (uploadedPath) {
        await images.remove(uploadedPath);
      }
      if (createdProductId) {
        await store.deleteProduct(createdProductId);
      }
      summary.errors += 1;
      items.push({
        title: kit.title,
        team: kit.team,
        season: kit.season,
        type: kit.type,
        status: "ERROR",
        productId: null,
        slug: null,
        message: err instanceof Error ? err.message : "Error inesperado al importar.",
      });
    }
  }

  return { items, summary };
}
