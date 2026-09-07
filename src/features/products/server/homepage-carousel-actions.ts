"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/features/auth/server/session";
import { HOMEPAGE_CAROUSEL_MAX } from "@/features/products/domain/homepage-carousel-slides";
import {
  findEligibleCarouselImageIds,
  saveHomepageCarouselImageIds,
} from "@/features/products/repositories/homepage-carousel-repository";
import { saveError, saveSuccess, type AdminSaveResult } from "@/shared/admin/admin-save-result";

const imageIdsSchema = z.array(z.string().min(1)).max(HOMEPAGE_CAROUSEL_MAX);

export async function saveHomepageCarouselAction(
  imageIds: string[],
): Promise<AdminSaveResult> {
  const admin = await getSessionUser();
  if (!admin) return saveError("No autorizado.");

  const parsed = imageIdsSchema.safeParse(imageIds);
  if (!parsed.success) {
    return saveError("Selecciona como máximo 5 fotos.");
  }

  const unique = [...new Set(parsed.data)];
  if (unique.length !== parsed.data.length) {
    return saveError("Hay fotos repetidas.");
  }

  if (unique.length > 0) {
    const eligible = await findEligibleCarouselImageIds(unique);
    const missing = unique.filter((id) => !eligible.has(id));
    if (missing.length > 0) {
      return saveError("Alguna foto ya no es visible en la tienda.");
    }
  }

  try {
    await saveHomepageCarouselImageIds(unique);
    revalidatePath("/");
    revalidatePath("/admin/productos");
    return saveSuccess();
  } catch {
    return saveError("No se pudo guardar el carrusel. Intenta de nuevo.");
  }
}
