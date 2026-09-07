/**
 * Regla de negocio del Admin: no se puede eliminar un producto
 * que tenga variantes, proveedores o imágenes.
 * Pura: usable desde el cliente (botón) y el servidor (acción).
 */

export type ProductDeleteCounts = {
  variants: number;
  suppliers: number;
  images: number;
};

export function productDeleteBlockers(counts: ProductDeleteCounts): string[] {
  const reasons: string[] = [];
  if (counts.variants > 0) reasons.push(`${counts.variants} variante(s)`);
  if (counts.suppliers > 0) reasons.push(`${counts.suppliers} proveedor(es)`);
  if (counts.images > 0) reasons.push(`${counts.images} imagen(es)`);
  return reasons;
}

export function formatReasonList(reasons: string[]): string {
  if (reasons.length <= 1) return reasons[0] ?? "";
  if (reasons.length === 2) return `${reasons[0]} y ${reasons[1]}`;
  return `${reasons.slice(0, -1).join(", ")} y ${reasons[reasons.length - 1]}`;
}

export function productDeleteBlockedMessage(reasons: string[]): string {
  return `No se puede eliminar: tiene ${formatReasonList(reasons)}. Quita primero esas dependencias, o ocúltalo de la tienda (desactivar).`;
}
