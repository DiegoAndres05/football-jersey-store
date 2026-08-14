/**
 * FASE A — Exporta TODOS los datos de la base SQLite actual a JSON.
 * Se ejecuta ANTES de cambiar el datasource a PostgreSQL.
 * Salida: ruta pasada por argumento (fuera del repo).
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

const TABLES = [
  "league",
  "team",
  "player",
  "season",
  "version",
  "size",
  "product",
  "productImage",
  "productVariant",
  "inventoryMovement",
  "supplier",
  "supplierProduct",
  "customer",
  "address",
  "user",
  "order",
  "orderItem",
  "orderStatusHistory",
] as const;

async function main() {
  const outPath = process.argv[2];
  if (!outPath) throw new Error("Uso: npx tsx scripts/export-sqlite.ts <salida.json>");

  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    // @ts-expect-error — accesos dinámicos a modelos de Prisma
    data[t] = await prisma[t].findMany({ orderBy: { id: "asc" } });
  }
  data.setting = await prisma.setting.findMany({ orderBy: { key: "asc" } });

  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(
    "Exportadas:",
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (v as unknown[]).length])),
  );
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });