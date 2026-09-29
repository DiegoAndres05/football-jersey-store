import { PrismaClient } from "@prisma/client";
import { seedMysteryBox } from "../prisma/seed-mystery-box";

const prisma = new PrismaClient();

async function main() {
  const versions = [
    { slug: "fan", name: "Fan", priceAdjustment: 0 },
    { slug: "player", name: "Player", priceAdjustment: 20_000 },
    { slug: "retro", name: "Retro", priceAdjustment: 30_000 },
  ];
  const sizes = ["S", "M", "L", "XL", "XXL"];

  for (const version of versions) {
    await prisma.version.upsert({
      where: { slug: version.slug },
      update: version,
      create: version,
    });
  }

  for (const [index, code] of sizes.entries()) {
    await prisma.size.upsert({
      where: { code },
      update: { name: code, position: index + 1 },
      create: { code, name: code, position: index + 1 },
    });
  }

  await seedMysteryBox(prisma);
  console.log("✅ Caja misteriosa cargada sin restaurar el catálogo demo.");
}

main()
  .catch((error) => {
    console.error("❌ Error cargando la caja misteriosa:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
