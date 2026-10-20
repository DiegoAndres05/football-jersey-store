"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/features/auth/server/session";
import { persistShippingRates } from "@/features/system/repositories/shipping-rates-repository";
import { validateShippingRates } from "@/features/system/schemas/shipping-rates-schema";
import type { AdminSaveResult } from "@/shared/admin/admin-save-result";

export async function updateShippingRatesAction(
  _prevState: AdminSaveResult | null,
  formData: FormData,
): Promise<AdminSaveResult> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = validateShippingRates(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    await persistShippingRates(parsed.data);
    revalidatePath("/admin/ajustes");
    revalidatePath("/carrito");
    revalidatePath("/checkout");
    return { ok: true };
  } catch (error) {
    console.error("[shipping] no se pudieron guardar las tarifas:", error);
    return { ok: false, error: "No pudimos guardar los envíos. Intenta de nuevo." };
  }
}
