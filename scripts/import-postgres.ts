/**
 * FASE C — Importa los datos exportados de SQLite (JSON) a PostgreSQL.
 * Preserva IDs y relaciones. Orden de inserción respeta FK.
 * Uso: npx tsx scripts/import-postgres.ts <export.json>
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

const ORDER: { model: string; table: string }[] = [
  { model: "league", table: "league" },
  { model: "season", table: "season" },
  { model: "version", table: "version" },
  { model: "size", table: "size" },
  { model: "team", table: "team" },
  { model: "player", table: "player" },
  { model: "user", table: "user" },
  { model: "product", table: "product" },
  { model: "productImage", table: "productImage" },
  { model: "productVariant", table: "productVariant" },
  { model: "supplier", table: "supplier" },
  { model: "supplierProduct", table: "supplierProduct" },
  { model: "customer", table: "customer" },
  { model: "address", table: "address" },
  { model: "order", table: "order" },
  { model: "orderItem", table: "orderItem" },
  { model: "orderStatusHistory", table: "orderStatusHistory" },
  { model: "inventoryMovement", table: "inventoryMovement" },
  { model: "setting", table: "setting" },
];

async function main() {
  const src = process.argv[2];
  if (!src) throw new Error("Uso: npx tsx scripts/import-postgres.ts <export.json>");
  const data = JSON.parse(readFileSync(src, "utf8")) as Record<string, unknown[]>;

  const summary: Record<string, number> = {};
  for (const step of ORDER) {
    const rows = data[step.table] ?? [];
    if (rows.length === 0) {
      summary[step.table] = 0;
      continue;
    }
    // @ts-expect-error — accesos dinámicos a modelos de Prisma
    await prisma[step.model].createMany({ data: rows as never[], skipDuplicates: false });
    summary[step.table] = rows.length;
  }
  console.log("Importadas:", summary);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error("IMPORT FALLIDO:", e.message);
    process.exit(1);
  });