"use server";

import { getSessionUser } from "@/features/auth/server/session";
import {
  uploadProductImage,
  deleteProductImage,
  replaceProductImage,
  setPrimaryProductImage,
} from "@/features/products/services/image-storage";

/**
 * Acciones de imágenes de producto. Uso exclusivo del Admin:
 * el guard de autorización es la sesión de administrador existente.
 * Los errores de negocio se propagan como ImageStorageError (con
 * mensaje amigable) y se muestran en el error.tsx de la ruta.
 */

export async function uploadProductImageAction(productId: string, formData: FormData) {
  const admin = await getSessionUser();
  if (!admin) throw new Error("No autorizado.");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Archivo no recibido.");

  await uploadProductImage({
    productId,
    file,
    altText: typeof formData.get("alt") === "string" ? (formData.get("alt") as string) : null,
  });
}

export async function deleteProductImageAction(imageId: string) {
  const admin = await getSessionUser();
  if (!admin) throw new Error("No autorizado.");

  await deleteProductImage(imageId);
}

export async function replaceProductImageAction(imageId: string, formData: FormData) {
  const admin = await getSessionUser();
  if (!admin) throw new Error("No autorizado.");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Archivo no recibido.");

  await replaceProductImage(imageId, file, null);
}

export async function setPrimaryProductImageAction(imageId: string) {
  const admin = await getSessionUser();
  if (!admin) throw new Error("No autorizado.");

  await setPrimaryProductImage(imageId);
}