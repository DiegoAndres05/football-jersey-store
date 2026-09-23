import type { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClientCtor } from "@prisma/client";

const PRICES = { fan: 90000, player: 140000, retro: 180000 } as const;
const VERSION_SLUGS = ["fan", "player", "retro"] as const;

export async function seedMysteryBox(prisma: PrismaClient) {
  const league = await prisma.league.upsert({
    where: { slug: "interno" },
    update: { name: "Interno" },
    create: { slug: "interno", name: "Interno" },
  });
  const team = await prisma.team.upsert({
    where: { slug: "interno-caja-misteriosa" },
    update: { name: "Flashsport", leagueId: league.id },
    create: {
      slug: "interno-caja-misteriosa",
      name: "Flashsport",
      leagueId: league.id,
    },
  });
  const season = await prisma.season.upsert({
    where: { slug: "interno-caja-misteriosa" },
    update: { name: "Interno", year: 2026, isRetro: false },
    create: { slug: "interno-caja-misteriosa", name: "Interno", year: 2026, isRetro: false },
  });
  const product = await prisma.product.upsert({
    where: { slug: "caja-misteriosa" },
    update: {
      name: "Caja misteriosa",
      shortName: "Caja misteriosa",
      description:
        "Elige Básica, Estándar o Premium y tu talla. Dentro llega una camiseta de esa calidad. El equipo es sorpresa.",
      kitType: "ESPECIAL",
      isActive: true,
      isFeatured: false,
      productKind: "MYSTERY_BOX",
      customizationsEnabled: false,
      hasPlayerPrint: false,
      customizationSurcharge: 0,
      teamId: team.id,
      seasonId: season.id,
    },
    create: {
      slug: "caja-misteriosa",
      name: "Caja misteriosa",
      shortName: "Caja misteriosa",
      description:
        "Elige Básica, Estándar o Premium y tu talla. Dentro llega una camiseta de esa calidad. El equipo es sorpresa.",
      kitType: "ESPECIAL",
      isActive: true,
      isFeatured: false,
      productKind: "MYSTERY_BOX",
      customizationsEnabled: false,
      hasPlayerPrint: false,
      customizationSurcharge: 0,
      teamId: team.id,
      seasonId: season.id,
    },
  });

  const imageCount = await prisma.productImage.count({ where: { productId: product.id } });
  if (imageCount === 0) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=900&q=80",
        altText: "Caja misteriosa",
        order: 0,
        isPrimary: true,
      },
    });
  }

  const versions = await prisma.version.findMany({
    where: { slug: { in: [...VERSION_SLUGS] } },
  });
  const sizes = await prisma.size.findMany({ orderBy: { position: "asc" } });

  for (const version of versions) {
    const slug = version.slug as keyof typeof PRICES;
    const salePrice = PRICES[slug];
    if (!salePrice) continue;
    for (const size of sizes) {
      const unavailable = slug === "fan" && size.code === "XXL";
      const variant = await prisma.productVariant.upsert({
        where: {
          productId_versionId_sizeId: {
            productId: product.id,
            versionId: version.id,
            sizeId: size.id,
          },
        },
        update: {
          salePrice,
          allowsBackorder: !unavailable,
          sku: `CAJA-${version.slug.toUpperCase()}-${size.code}`,
        },
        create: {
          productId: product.id,
          versionId: version.id,
          sizeId: size.id,
          sku: `CAJA-${version.slug.toUpperCase()}-${size.code}`,
          costPrice: Math.round(salePrice * 0.45),
          salePrice,
          allowsBackorder: !unavailable,
          lowStockAt: 2,
          weight: 400,
        },
      });
      const movements = await prisma.inventoryMovement.count({ where: { variantId: variant.id } });
      if (movements === 0 && !unavailable) {
        await prisma.inventoryMovement.create({
          data: {
            variantId: variant.id,
            type: "IN",
            quantity: 6,
            reference: "INITIAL",
            reason: "Inventario inicial de caja misteriosa",
          },
        });
      }
    }
  }
}

const entry = process.argv[1] ?? "";
if (entry.includes("seed-mystery-box")) {
  const prisma = new PrismaClientCtor();
  seedMysteryBox(prisma)
    .then(() => {
      console.log("Caja misteriosa lista.");
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
