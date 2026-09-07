import type { AdminSaveResult } from "@/shared/admin/admin-save-result";
import { saveError, saveSuccess } from "@/shared/admin/admin-save-result";

export type ProductVisibilityDeps = {
  findProduct(id: string): Promise<{ id: string } | null>;
  setActive(id: string, isActive: boolean): Promise<void>;
};

export async function setProductActiveIfExists(
  productId: string,
  isActive: boolean,
  deps: ProductVisibilityDeps,
): Promise<AdminSaveResult> {
  try {
    const product = await deps.findProduct(productId);
    if (!product) return saveError("El producto no existe.");
    await deps.setActive(productId, isActive);
    return saveSuccess();
  } catch {
    return saveError("No se pudo actualizar la visibilidad. Intenta de nuevo.");
  }
}
