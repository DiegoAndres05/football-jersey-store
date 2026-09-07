/**
 * Una variante con movimientos de inventario no se borra:
 * el ledger es histórico.
 */

export function variantDeleteBlockedMessage(movementCount: number): string {
  return `No se puede eliminar: tiene ${movementCount} movimiento(s) de inventario. Conserva el histórico.`;
}

export function variantDeleteIsBlocked(movementCount: number): boolean {
  return movementCount > 0;
}
