import { prisma } from "@/lib/prisma";

/**
 * Lectura pública de la tasa USD vigente.
 * Se usa en Server Components y en el selector de moneda.
 */
export async function getPublicUsdRate(): Promise<
  { available: false } | { available: true; copPerUsd: number; updatedAt: string }
> {
  const [rateRow, enabledRow, updatedAtRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "usd_cop_rate" } }),
    prisma.setting.findUnique({ where: { key: "usd_enabled" } }),
    prisma.setting.findUnique({ where: { key: "usd_cop_rate_at" } }),
  ]);

  const enabled = enabledRow?.value === "true";
  const copPerUsd = parseInt(rateRow?.value ?? "0", 10);

  if (!enabled || copPerUsd < 1) {
    return { available: false };
  }

  return {
    available: true,
    copPerUsd,
    updatedAt: updatedAtRow?.value ?? new Date().toISOString(),
  };
}

/**
 * Persiste la tasa USD (solo admin).
 * Escribe las tres keys en Setting: usd_cop_rate, usd_enabled, usd_cop_rate_at.
 */
export async function persistUsdRate(copPerUsd: number, enabled: boolean) {
  const now = new Date().toISOString();

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: "usd_cop_rate" },
      update: { value: String(copPerUsd) },
      create: { key: "usd_cop_rate", value: String(copPerUsd) },
    }),
    prisma.setting.upsert({
      where: { key: "usd_enabled" },
      update: { value: String(enabled) },
      create: { key: "usd_enabled", value: String(enabled) },
    }),
    prisma.setting.upsert({
      where: { key: "usd_cop_rate_at" },
      update: { value: now },
      create: { key: "usd_cop_rate_at", value: now },
    }),
  ]);

  return { copPerUsd, enabled, updatedAt: now };
}
