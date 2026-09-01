import "server-only";
import { prisma } from "@/lib/prisma";
import { supabaseServer, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/server";
import type { FkaKit } from "../fka/types.ts";
import type { DbProduct, DbSeason, DbTeam } from "../fka/resolver.ts";
import { downloadFkaImage } from "../fka/fka-image.ts";
import { importFkaKitsAsDrafts } from "./import-logic.ts";
import type { ImageGateway, ImportStore } from "./import-logic.ts";

/**
 * Adaptador que conecta la lógica pura de importación con prisma y Supabase.
 */

export type ImageDownloader = (url: string) => Promise<{ buffer: Uint8Array; extension: string }>;

const prismaStore: ImportStore = {
  async slugExists(slug: string) {
    return Boolean(await prisma.product.findUnique({ where: { slug }, select: { id: true } }));
  },
  createProduct(data) {
    return prisma.product.create({ data });
  },
  async deleteProduct(id: string) {
    await prisma.product.delete({ where: { id } });
  },
  createImage(data) {
    return prisma.productImage.create({ data: { ...data, order: 0, isPrimary: true } });
  },
  async removeImage(storagePath: string) {
    await supabaseServer.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
  },
};

function makeSupabaseImageGateway(download: ImageDownloader): ImageGateway {
  return {
    download,
    async upload(storagePath: string, buffer: Uint8Array, mime: string) {
      const { error } = await supabaseServer.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(storagePath, buffer, { contentType: mime, upsert: false });
      if (error) throw new Error(`Error de Storage al subir la imagen: ${error.message}`);
    },
    async remove(storagePath: string) {
      await supabaseServer.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    },
    publicUrl(storagePath: string) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!base) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL.");
      return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
    },
  };
}

/**
 * downloadImage: transport de descarga de imagen. Por defecto usa fetch
 * directo con Referer (válido en tests y producción).
 */
export function importFkaKitsAsDraftsWithRealDeps(
  kits: FkaKit[],
  dbTeams: DbTeam[],
  dbSeasons: DbSeason[],
  dbProducts: DbProduct[],
  downloadImage: ImageDownloader = downloadFkaImage,
) {
  return importFkaKitsAsDrafts(kits, dbTeams, dbSeasons, dbProducts, prismaStore, makeSupabaseImageGateway(downloadImage));
}

export type { FkaImportResult, FkaImportSummary, FkaImportResultItem } from "./import-logic.ts";
