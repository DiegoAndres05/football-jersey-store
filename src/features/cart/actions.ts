"use server";

import { prisma } from "@/lib/prisma";
import { canAddLine } from "./add-line";
import { normalizePersonalization, personalizationSurcharge, validatePersonalization, type PersonalizationInput } from "@/features/products/personalization";
import { computeStock } from "@/features/products/repositories/product-repository";

export type AddCartLineInput = {
  variantId: string;
  quantity?: number;
  deliveryMode: "INMEDIATA" | "BAJO_PEDIDO";
  personalization?: PersonalizationInput;
};

export async function addCartLine(input: AddCartLineInput) {
  if (!Number.isInteger(input.quantity ?? 1) || (input.quantity ?? 1) < 1) return { ok: false as const, code: "INVALID_QUANTITY" };
  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: true, version: true, size: true },
  });
  if (!variant) return { ok: false as const, code: "VARIANT_NOT_FOUND" };
  const personalization = validatePersonalization(input.personalization ?? {}, { enabled: variant.product.customizationsEnabled });
  if (!personalization.ok) return personalization;
  const stock = await computeStock(variant.id);
  const guard = canAddLine({ stock, allowsBackorder: variant.allowsBackorder, deliveryMode: input.deliveryMode });
  if (!guard.ok) return guard;
  const value = personalization.value;
  const baseUnitPriceCop = variant.salePrice;
  const personalizationSurchargeCop = personalizationSurcharge(value.type, variant.product.customizationSurcharge);
  const unitPriceCop = baseUnitPriceCop + personalizationSurchargeCop;
  const quantity = input.quantity ?? 1;
  return {
    ok: true as const,
    line: { variantId: variant.id, quantity, deliveryMode: input.deliveryMode, personalization: value,
      baseUnitPriceCop, personalizationSurchargeCop, unitPriceCop, lineTotalCop: unitPriceCop * quantity,
      version: variant.version.name, size: variant.size.name },
  };
}

export type CartMutation = { lineId: string; quantity?: number };
export function validateCartMutation(input: CartMutation) {
  return input.lineId.trim().length > 0 && (!input.quantity || Number.isInteger(input.quantity) && input.quantity > 0);
}

export function updateCartQuantity<T extends { lineId: string; quantity: number }>(lines: readonly T[], lineId: string, quantity: number) {
  if (!validateCartMutation({ lineId, quantity })) return { ok: false as const, code: "INVALID_QUANTITY", lines: [...lines] };
  return { ok: true as const, lines: lines.map((line) => line.lineId === lineId ? { ...line, quantity } : line) };
}

export function removeCartLine<T extends { lineId: string }>(lines: readonly T[], lineId: string) {
  if (!lineId.trim()) return { ok: false as const, code: "INVALID_LINE", lines: [...lines] };
  return { ok: true as const, lines: lines.filter((line) => line.lineId !== lineId) };
}
