export type PendingLineSignature = {
  variantId: string;
  quantity: number;
  customizationType: string;
  customizationName?: string | null;
  customizationNumber?: string | null;
  deliveryMode: string;
};

export type PendingMoneySnapshot = {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  saleCurrency: string;
};

export function pendingLineSignature(lines: readonly PendingLineSignature[]): string {
  return lines
    .map((line) => [
      line.variantId,
      line.quantity,
      line.customizationType,
      (line.customizationName ?? "").trim(),
      (line.customizationNumber ?? "").trim(),
      line.deliveryMode,
    ].join(":"))
    .sort()
    .join("||");
}

export function samePendingOrder(input: {
  existingLines: readonly PendingLineSignature[];
  nextLines: readonly PendingLineSignature[];
  existingMoney: PendingMoneySnapshot;
  nextMoney: PendingMoneySnapshot;
}): boolean {
  if (pendingLineSignature(input.existingLines) !== pendingLineSignature(input.nextLines)) return false;
  const current = input.existingMoney;
  const next = input.nextMoney;
  return current.subtotal === next.subtotal
    && current.shippingFee === next.shippingFee
    && current.discountAmount === next.discountAmount
    && current.total === next.total
    && current.saleCurrency === next.saleCurrency;
}
