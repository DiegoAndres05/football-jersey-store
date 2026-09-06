import type { AdminSaveResult } from "@/shared/admin/admin-save-result";
import { saveError, saveSuccess } from "@/shared/admin/admin-save-result";
import {
  productDeleteBlockers,
  productDeleteBlockedMessage,
} from "@/features/catalog/product-delete-rules";

export type ProductDeleteRecord = {
  id: string;
  images: { id: string; storagePath: string | null }[];
  _count: { variants: number; supplierProducts: number; images: number };
};

export type ProductDeleteDeps = {
  findProduct(id: string): Promise<ProductDeleteRecord | null>;
  removeStorage(paths: string[]): Promise<void>;
  deleteImages(productId: string): Promise<void>;
  deleteProduct(id: string): Promise<void>;
};

/**
 * Elimina un producto solo si no tiene variantes, proveedores ni imágenes.
 * Los errores de negocio y de persistencia se devuelven como resultado
 * (nunca se lanzan) para que la UI pueda mostrarlos.
 */
export async function deleteProductIfAllowed(
  productId: string,
  deps: ProductDeleteDeps,
): Promise<AdminSaveResult> {
  try {
    const product = await deps.findProduct(productId);
    if (!product) return saveError("El producto no existe.");

    const reasons = productDeleteBlockers({
      variants: product._count.variants,
      suppliers: product._count.supplierProducts,
      images: product._count.images,
    });
    if (reasons.length > 0) {
      return saveError(productDeleteBlockedMessage(reasons));
    }

    const storagePaths = product.images
      .map((img) => img.storagePath)
      .filter((path): path is string => Boolean(path));
    if (storagePaths.length > 0) {
      try {
        await deps.removeStorage(storagePaths);
      } catch {
        /* Storage es best-effort; la fila de BD es la fuente de verdad. */
      }
    }

    await deps.deleteImages(productId);
    await deps.deleteProduct(productId);
    return saveSuccess();
  } catch {
    return saveError("No se pudo eliminar el producto. Intenta de nuevo.");
  }
}
