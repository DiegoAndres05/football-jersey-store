import "server-only";
import { prisma } from "@/lib/prisma";
import { supabaseServer, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/server";

/**
 * Capa server-side de imágenes de producto en Supabase Storage.
 * - Upload/delete/replace se hacen con service role (nunca en cliente).
 * - Los archivos viven en products/{productId}/{nombre}.{ext}.
 * - Las imágenes históricas (url externa, storagePath null) NO se tocan.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ImageUploadInput = {
  productId: string;
  file: File;
  altText?: string | null;
};

export class ImageStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageStorageError";
  }
}

function validateImageFile(file: File): void {
  if (!file || file.size === 0) throw new ImageStorageError("El archivo está vacío.");
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageStorageError("La imagen supera el tamaño máximo de 5 MB.");
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new ImageStorageError("Formato no permitido. Usa JPG, PNG o WebP.");
  }
}

function publicImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new ImageStorageError("Falta NEXT_PUBLIC_SUPABASE_URL.");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
}

export function getProductImageUrl(storagePath: string | null | undefined, fallbackUrl: string): string {
  return storagePath ? publicImageUrl(storagePath) : fallbackUrl;
}

function normalizeFileName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "imagen"
  );
}

export async function uploadProductImage(input: ImageUploadInput) {
  validateImageFile(input.file);
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { slug: true },
  });
  if (!product) throw new ImageStorageError("El producto no existe.");

  const ext = EXT_BY_MIME[input.file.type];
  const order = await prisma.productImage.count({ where: { productId: input.productId } });
  const storagePath = `products/${input.productId}/${normalizeFileName(product.slug)}-${Date.now()}-${order}.${ext}`;

  const { error } = await supabaseServer.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, input.file, { contentType: input.file.type, upsert: false });
  if (error) throw new ImageStorageError(`Error de Storage al subir: ${error.message}`);

  try {
    const image = await prisma.productImage.create({
      data: {
        productId: input.productId,
        url: publicImageUrl(storagePath),
        altText: input.altText ?? null,
        order,
        isPrimary: order === 0,
        storagePath,
      },
    });
    return image;
  } catch (err) {
    // Rollback del archivo si la fila no se pudo crear (sin huérfanos).
    await supabaseServer.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    throw err;
  }
}

export type ImageStorageDeleteDeps = {
  findImage(
    imageId: string,
  ): Promise<{ productId: string; isPrimary: boolean; storagePath: string | null } | null>;
  removeFile(storagePath: string): Promise<{ error: unknown }>;
  deleteRow(imageId: string, productId: string, wasPrimary: boolean): Promise<void>;
};

/**
 * Distingue el error "el objeto ya no existe en Storage" (delete idempotente)
 * de errores reales (permisos, bucket incorrecto, credenciales, etc.),
 * que SIEMPRE deben propagarse.
 */
export function isMissingObjectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number | string; statusCode?: string | number; code?: string; message?: string };
  const message = String(e.message ?? "");
  const code = String(e.code ?? "");

  if (code === "NoSuchBucket" || /denied|forbidden|unauthorized|credential/i.test(message)) {
    return false;
  }
  if (code === "NoSuchKey") return true;

  const status = Number(e.status ?? e.statusCode ?? 0);
  if (status === 404 && !/bucket/i.test(message)) return true;
  return /not.?found|no.?such.?key/i.test(message) && !/bucket/i.test(message);
}

export async function deleteProductImage(imageId: string, deps?: Partial<ImageStorageDeleteDeps>) {
  const findImage =
    deps?.findImage ??
    (async (id) =>
      prisma.productImage.findUnique({
        where: { id },
        select: { productId: true, isPrimary: true, storagePath: true },
      }));
  const removeFile =
    deps?.removeFile ??
    (async (storagePath) => supabaseServer.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]));
  const deleteRow =
    deps?.deleteRow ??
    (async (id, productId, wasPrimary) => {
      await prisma.$transaction(async (tx) => {
        await tx.productImage.delete({ where: { id } });
        if (wasPrimary) {
          const next = await tx.productImage.findFirst({
            where: { productId },
            orderBy: { order: "asc" },
          });
          if (next) await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
        }
      });
    });

  const image = await findImage(imageId);
  if (!image) throw new ImageStorageError("La imagen no existe.");

  // Borrado idempotente: primero el archivo, después la fila.
  // Si el objeto físico ya no existe, la eliminación se considera completada.
  if (image.storagePath) {
    const { error } = await removeFile(image.storagePath);
    if (error && !isMissingObjectError(error)) {
      const detail =
        error instanceof Error
          ? error.message
          : error && typeof error === "object" && "message" in error
            ? String((error as { message?: unknown }).message)
            : String(error);
      throw new ImageStorageError(`Error de Storage al eliminar: ${detail}`);
    }
  }

  await deleteRow(imageId, image.productId, image.isPrimary);
}

export async function replaceProductImage(imageId: string, file: File, altText?: string | null) {
  validateImageFile(file);
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) throw new ImageStorageError("La imagen no existe.");
  if (!image.storagePath) {
    throw new ImageStorageError("No se puede reemplazar una imagen externa. Elimínala y sube una nueva.");
  }

  const { error } = await supabaseServer.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .update(image.storagePath, file, { contentType: file.type, upsert: true });
  if (error) throw new ImageStorageError(`Error de Storage al reemplazar: ${error.message}`);

  return prisma.productImage.update({
    where: { id: imageId },
    data: { url: publicImageUrl(image.storagePath), altText: altText ?? null },
  });
}

export async function setPrimaryProductImage(imageId: string) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) throw new ImageStorageError("La imagen no existe.");

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId: image.productId, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
}