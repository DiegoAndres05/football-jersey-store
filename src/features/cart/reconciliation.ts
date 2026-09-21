export type ReconciliationLine = { variantId: string; quantity: number; availableStock: number; allowsBackorder: boolean };
export type ReconciliationResult = { lines: ReconciliationLine[]; changed: boolean; messages: string[] };

export function reconcileLines(lines: readonly ReconciliationLine[]): ReconciliationResult {
  let changed = false;
  const messages: string[] = [];
  const next = lines.flatMap((line) => {
    const max = line.allowsBackorder ? line.quantity : Math.max(0, Math.min(line.quantity, line.availableStock));
    if (max !== line.quantity) {
      changed = true;
      if (max === 0) messages.push(`La variante ${line.variantId} ya no está disponible.`);
      else messages.push(`La cantidad de ${line.variantId} se ajustó a ${max}.`);
    }
    return max > 0 ? [{ ...line, quantity: max }] : [];
  });
  return { lines: next, changed, messages };
}
