import {
  variantDeleteBlockedMessage,
  variantDeleteIsBlocked,
} from "@/features/catalog/variant-delete-rules";

export type VariantDeleteRecord = {
  id: string;
  productSlug: string;
  movementCount: number;
};

export type VariantDeleteDeps = {
  findVariant(id: string): Promise<VariantDeleteRecord | null>;
  deleteVariant(id: string): Promise<void>;
};

export type VariantDeleteResult =
  | { ok: true; productSlug: string }
  | { ok: false; error: string };

/**
 * Elimina una variante solo si no tiene movimientos de inventario.
 * Nunca lanza: la UI muestra el resultado.
 */
export async function deleteVariantIfAllowed(
  variantId: string,
  deps: VariantDeleteDeps,
): Promise<VariantDeleteResult> {
  try {
    const variant = await deps.findVariant(variantId);
    if (!variant) return { ok: false, error: "La variante no existe." };

    if (variantDeleteIsBlocked(variant.movementCount)) {
      return { ok: false, error: variantDeleteBlockedMessage(variant.movementCount) };
    }

    await deps.deleteVariant(variantId);
    return { ok: true, productSlug: variant.productSlug };
  } catch {
    return { ok: false, error: "No se pudo eliminar la variante. Intenta de nuevo." };
  }
}
