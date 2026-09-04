"use server";

import { getSessionUser } from "@/features/auth/server/session";
import { validateUsdRate } from "@/features/system/schemas/usd-rate-schema";
import { persistUsdRate } from "@/features/system/repositories/usd-rate-repository";
import type { AdminSaveResult } from "@/shared/admin/admin-save-result";

/**
 * Server action para actualizar la tasa USD de conversión.
 * Solo administradores autenticados.
 */
export async function updateUsdRateAction(
  _prevState: AdminSaveResult | null,
  formData: FormData,
): Promise<AdminSaveResult> {
  // Auth check
  const admin = await getSessionUser();
  if (!admin) {
    return { ok: false, error: "No autorizado." };
  }

  // Validate input
  const parsed = validateUsdRate(formData);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { ok: false, error: msg };
  }

  try {
    await persistUsdRate(parsed.data.copPerUsd, parsed.data.enabled);
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al guardar la tasa. Intenta de nuevo." };
  }
}
