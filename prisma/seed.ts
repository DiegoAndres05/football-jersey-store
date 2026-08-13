import { PrismaClient } from "@prisma/client";
import { SITE } from "../src/shared/config/site";

const prisma = new PrismaClient();

const IMG = {
  white: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=900&q=80",
  red: "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=80",
  blue: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80",
  black: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=900&q=80",
  yellow: "https://images.unsplash.com/photo-1606932968471-93b00a3250a1?auto=format&fit=crop&w=900&q=80",
  green: "https://images.unsplash.com/photo-1552663539-4794274cf1be?auto=format&fit=crop&w=900&q=80",
};

async function main() {
  console.log("🌱 Seed iniciado...");

  // ── Cleanup ──
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.supplierOrderItem.deleteMany();
  await prisma.supplierOrder.deleteMany();
  await prisma.supplierProduct.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.player.deleteMany();
  await prisma.season.deleteMany();
  await prisma.team.deleteMany();
  await prisma.league.deleteMany();
  await prisma.version.deleteMany();
  await prisma.size.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  // ── Versions ──
  const versions = await Promise.all([
    prisma.version.create({ data: { slug: "fan", name: "Fan", priceAdjustment: 0 } }),
    prisma.version.create({ data: { slug: "player", name: "Player", priceAdjustment: 20000 } }),
    prisma.version.create({ data: { slug: "retro", name: "Retro", priceAdjustment: 30000 } }),
    prisma.version.create({ data: { slug: "training", name: "Entrenamiento", priceAdjustment: 10000 } }),
  ]);
  const vFan = versions[0]!, vPlayer = versions[1]!, vRetro = versions[2]!, vTraining = versions[3]!;

  // ── Sizes ──
  const sizes = await Promise.all([
    prisma.size.create({ data: { code: "S", name: "S", position: 1 } }),
    prisma.size.create({ data: { code: "M", name: "M", position: 2 } }),
    prisma.size.create({ data: { code: "L", name: "L", position: 3 } }),
    prisma.size.create({ data: { code: "XL", name: "XL", position: 4 } }),
    prisma.size.create({ data: { code: "XXL", name: "XXL", position: 5 } }),
  ]);
  const szS = sizes[0]!, szM = sizes[1]!, szL = sizes[2]!, szXL = sizes[3]!, szXXL = sizes[4]!;

  // ── Leagues ──
  const [laLiga, premier, serieA, bundes, ligue1, ligaCol, selecciones] = await Promise.all([
    prisma.league.create({ data: { slug: "la-liga", name: "La Liga", country: "España" } }),
    prisma.league.create({ data: { slug: "premier-league", name: "Premier League", country: "Inglaterra" } }),
    prisma.league.create({ data: { slug: "serie-a", name: "Serie A", country: "Italia" } }),
    prisma.league.create({ data: { slug: "bundesliga", name: "Bundesliga", country: "Alemania" } }),
    prisma.league.create({ data: { slug: "ligue-1", name: "Ligue 1", country: "Francia" } }),
    prisma.league.create({ data: { slug: "liga-betplay", name: "Liga BetPlay", country: "Colombia" } }),
    prisma.league.create({ data: { slug: "selecciones", name: "Selecciones" } }),
  ]);

  // ── Teams ──
  const [realMadrid, barcelona, atletico, manCity, liverpool, arsenal, inter, acMilan, bayern, psg, millonarios, nacional, colombiaSel] = await Promise.all([
    prisma.team.create({ data: { slug: "real-madrid", name: "Real Madrid", shortName: "RMA", country: "España", leagueId: laLiga.id } }),
    prisma.team.create({ data: { slug: "barcelona", name: "FC Barcelona", shortName: "BAR", country: "España", leagueId: laLiga.id } }),
    prisma.team.create({ data: { slug: "atletico-madrid", name: "Atlético de Madrid", shortName: "ATM", country: "España", leagueId: laLiga.id } }),
    prisma.team.create({ data: { slug: "manchester-city", name: "Manchester City", shortName: "MCI", country: "Inglaterra", leagueId: premier.id } }),
    prisma.team.create({ data: { slug: "liverpool", name: "Liverpool FC", shortName: "LIV", country: "Inglaterra", leagueId: premier.id } }),
    prisma.team.create({ data: { slug: "arsenal", name: "Arsenal", shortName: "ARS", country: "Inglaterra", leagueId: premier.id } }),
    prisma.team.create({ data: { slug: "inter", name: "Inter de Milán", shortName: "INT", country: "Italia", leagueId: serieA.id } }),
    prisma.team.create({ data: { slug: "ac-milan", name: "AC Milan", shortName: "MIL", country: "Italia", leagueId: serieA.id } }),
    prisma.team.create({ data: { slug: "bayern", name: "Bayern Munich", shortName: "BAY", country: "Alemania", leagueId: bundes.id } }),
    prisma.team.create({ data: { slug: "paris-saint-germain", name: "Paris Saint-Germain", shortName: "PSG", country: "Francia", leagueId: ligue1.id } }),
    prisma.team.create({ data: { slug: "millonarios", name: "Millonarios FC", shortName: "MIL", country: "Colombia", leagueId: ligaCol.id } }),
    prisma.team.create({ data: { slug: "nacional", name: "Atlético Nacional", shortName: "NAL", country: "Colombia", leagueId: ligaCol.id } }),
    prisma.team.create({ data: { slug: "colombia", name: "Selección Colombia", shortName: "COL", country: "Colombia", leagueId: selecciones.id } }),
  ]);

  // ── Players ──
  const playersByTeam: { team: { id: string }; players: { name: string; number: string }[] }[] = [
    { team: realMadrid, players: [
      { name: "Vinícius Júnior", number: "7" }, { name: "Jude Bellingham", number: "5" }, { name: "Kylian Mbappé", number: "9" }, { name: "Fede Valverde", number: "8" },
    ]},
    { team: barcelona, players: [
      { name: "Lamine Yamal", number: "19" }, { name: "Robert Lewandowski", number: "9" }, { name: "Pedri", number: "8" },
    ]},
    { team: atletico, players: [
      { name: "Antoine Griezmann", number: "7" }, { name: "Julián Álvarez", number: "19" }, { name: "Koke", number: "6" },
    ]},
    { team: manCity, players: [
      { name: "Erling Haaland", number: "9" }, { name: "Kevin De Bruyne", number: "17" }, { name: "Phil Foden", number: "47" },
    ]},
    { team: liverpool, players: [
      { name: "Mohamed Salah", number: "11" }, { name: "Virgil van Dijk", number: "4" }, { name: "Luis Díaz", number: "7" },
    ]},
    { team: arsenal, players: [
      { name: "Bukayo Saka", number: "7" }, { name: "Martin Ødegaard", number: "8" }, { name: "Declan Rice", number: "41" },
    ]},
    { team: inter, players: [
      { name: "Lautaro Martínez", number: "10" }, { name: "Nicolò Barella", number: "23" }, { name: "Hakan Çalhanoğlu", number: "20" },
    ]},
    { team: acMilan, players: [
      { name: "Rafael Leão", number: "10" }, { name: "Theo Hernández", number: "19" }, { name: "Christian Pulisic", number: "11" },
    ]},
    { team: bayern, players: [
      { name: "Harry Kane", number: "9" }, { name: "Jamal Musiala", number: "42" }, { name: "Joshua Kimmich", number: "6" },
    ]},
    { team: psg, players: [
      { name: "Ousmane Dembélé", number: "10" }, { name: "Achraf Hakimi", number: "2" }, { name: "Vitinha", number: "17" },
    ]},
    { team: millonarios, players: [
      { name: "Radamel Falcao", number: "3" }, { name: "Daniel Cataño", number: "10" }, { name: "David Mackalister Silva", number: "14" },
    ]},
    { team: nacional, players: [
      { name: "Jefferson Duque", number: "9" }, { name: "Dorlan Pabón", number: "10" }, { name: "Sebastián Gómez", number: "8" },
    ]},
    { team: colombiaSel, players: [
      { name: "James Rodríguez", number: "10" }, { name: "Luis Díaz", number: "7" }, { name: "Davinson Sánchez", number: "23" },
    ]},
  ];
  for (const { team, players } of playersByTeam) {
    await prisma.player.createMany({
      data: players.map((p) => ({ teamId: team.id, ...p })),
    });
  }

  // ── Seasons ──
  const [sCurrent, sPrev, sRetro98, sRetro06, sRetro10] = await Promise.all([
    prisma.season.create({ data: { slug: "25-26", name: "Temporada 25/26", year: 2025 } }),
    prisma.season.create({ data: { slug: "24-25", name: "Temporada 24/25", year: 2024 } }),
    prisma.season.create({ data: { slug: "retro-1998", name: "Retro 1998", isRetro: true, year: 1998 } }),
    prisma.season.create({ data: { slug: "retro-2006", name: "Retro 2006", isRetro: true, year: 2006 } }),
    prisma.season.create({ data: { slug: "retro-2010", name: "Retro 2010", isRetro: true, year: 2010 } }),
  ]);

  // ── Suppliers ──
  const [supA, supB, supC] = await Promise.all([
    prisma.supplier.create({
      data: {
        slug: "asia-textiles", name: "Asia Textiles Co.", country: "China",
        leadTimeDays: 18, email: "sales@asiatextiles.example",
        purchaseNotes: "Proveedor principal. MOQ 10 unidades.", priority: 2,
      },
    }),
    prisma.supplier.create({
      data: {
        slug: "europa-kits", name: "Europa Kits Ltd.", country: "Turquía",
        leadTimeDays: 12, email: "hello@europakits.example",
        purchaseNotes: "Backup. Tiempos más cortos.", priority: 1,
      },
    }),
    prisma.supplier.create({
      data: {
        slug: "premium-sports", name: "Premium Sports", country: "Vietnam",
        leadTimeDays: 22, email: "trade@premiumsports.example",
        purchaseNotes: "Calidad premium, precio más alto.", priority: 0,
      },
    }),
  ]);

  // ── Products ──
  interface ProductSeed {
    slug: string; name: string; shortName: string; description: string;
    basePrice: number; brand: string; kitType: "LOCAL" | "VISITANTE" | "TERCERA" | "ENTRENAMIENTO" | "ESPECIAL";
    isFeatured?: boolean; hasPlayerPrint?: boolean; customizationsEnabled?: boolean;
    teamId: string; seasonId: string;
  }

  const productSeeds: ProductSeed[] = [
    { slug: "real-madrid-25-26-local", name: "Real Madrid 25/26 Local", shortName: "RMA Local",
      description: "Camiseta local del Real Madrid temporada 25/26. Diseño clásico blanco con detalles dorados.",
      basePrice: 89900, brand: "Adidas", kitType: "LOCAL", isFeatured: true, hasPlayerPrint: true,
      teamId: realMadrid.id, seasonId: sCurrent.id },
    { slug: "real-madrid-25-26-visitante", name: "Real Madrid 25/26 Visitante", shortName: "RMA Visitante",
      description: "Camiseta visitante del Real Madrid 25/26 en negro con acentos rosa.",
      basePrice: 89900, brand: "Adidas", kitType: "VISITANTE", isFeatured: true, hasPlayerPrint: true,
      teamId: realMadrid.id, seasonId: sCurrent.id },
    { slug: "real-madrid-retro-1998", name: "Real Madrid Retro 1998", shortName: "RMA Retro 98",
      description: "Edición retro 97/98. Réplica con cuello tipo polo.",
      basePrice: 119900, brand: "Adidas", kitType: "ESPECIAL", isFeatured: true,
      teamId: realMadrid.id, seasonId: sRetro98.id },
    { slug: "barcelona-25-26-local", name: "FC Barcelona 25/26 Local", shortName: "BAR Local",
      description: "Camiseta local del Barça 25/26. Blaugrana con rayas verticales.",
      basePrice: 89900, brand: "Nike", kitType: "LOCAL", isFeatured: true, hasPlayerPrint: true,
      teamId: barcelona.id, seasonId: sCurrent.id },
    { slug: "barcelona-retro-2006", name: "FC Barcelona Retro 2006", shortName: "BAR Retro 06",
      description: "Camiseta del bicampeonato 2006.",
      basePrice: 119900, brand: "Nike", kitType: "ESPECIAL",
      teamId: barcelona.id, seasonId: sRetro06.id },
    { slug: "atletico-25-26-local", name: "Atlético de Madrid 25/26 Local", shortName: "ATM Local",
      description: "Rojo y blanco, los colores del Atleti.",
      basePrice: 89900, brand: "Nike", kitType: "LOCAL", hasPlayerPrint: true,
      teamId: atletico.id, seasonId: sCurrent.id },
    { slug: "manchester-city-25-26-local", name: "Manchester City 25/26 Local", shortName: "MCI Local",
      description: "Celeste del Manchester City.",
      basePrice: 89900, brand: "Puma", kitType: "LOCAL", isFeatured: true, hasPlayerPrint: true,
      teamId: manCity.id, seasonId: sCurrent.id },
    { slug: "liverpool-25-26-local", name: "Liverpool 25/26 Local", shortName: "LIV Local",
      description: "El rojo del Liverpool.",
      basePrice: 89900, brand: "Nike", kitType: "LOCAL", isFeatured: true, hasPlayerPrint: true,
      teamId: liverpool.id, seasonId: sCurrent.id },
    { slug: "arsenal-25-26-local", name: "Arsenal 25/26 Local", shortName: "ARS Local",
      description: "Gunners 25/26 en rojo y blanco.",
      basePrice: 89900, brand: "Adidas", kitType: "LOCAL",
      teamId: arsenal.id, seasonId: sCurrent.id },
    { slug: "inter-25-26-local", name: "Inter de Milán 25/26 Local", shortName: "INT Local",
      description: "Nerazzurri 25/26. Negro y azul con detalles dorados.",
      basePrice: 89900, brand: "Nike", kitType: "LOCAL", hasPlayerPrint: true,
      teamId: inter.id, seasonId: sCurrent.id },
    { slug: "ac-milan-25-26-local", name: "AC Milan 25/26 Local", shortName: "MIL Local",
      description: "Rossoneri 25/26. Rojo y negro.",
      basePrice: 89900, brand: "Puma", kitType: "LOCAL",
      teamId: acMilan.id, seasonId: sCurrent.id },
    { slug: "bayern-25-26-local", name: "Bayern Munich 25/26 Local", shortName: "BAY Local",
      description: "Bayern 25/26 en rojo bávaro.",
      basePrice: 89900, brand: "Adidas", kitType: "LOCAL", hasPlayerPrint: true,
      teamId: bayern.id, seasonId: sCurrent.id },
    { slug: "millonarios-25-26-local", name: "Millonarios 25/26 Local", shortName: "MIL Local",
      description: "El azul embajador.",
      basePrice: 89900, brand: "Adidas", kitType: "LOCAL",
      teamId: millonarios.id, seasonId: sCurrent.id },
    { slug: "nacional-25-26-local", name: "Atlético Nacional 25/26 Local", shortName: "NAL Local",
      description: "Verde paisa.",
      basePrice: 89900, brand: "Nike", kitType: "LOCAL",
      teamId: nacional.id, seasonId: sCurrent.id },
    { slug: "colombia-2026-local", name: "Selección Colombia 2026 Local", shortName: "COL 2026",
      description: "Camiseta de la Selección Colombia rumbo al mundial 2026.",
      basePrice: 99900, brand: "Adidas", kitType: "LOCAL", isFeatured: true, hasPlayerPrint: true,
      teamId: colombiaSel.id, seasonId: sCurrent.id },
  ];

  const versionList = [
    { version: vFan, suffix: "FAN" },
    { version: vPlayer, suffix: "PLAYER" },
    { version: vRetro, suffix: "RETRO" },
    { version: vTraining, suffix: "TRAINING" },
  ];
  const sizeList = [szS, szM, szL, szXL, szXXL];

  // Stock map para variantes: clave = "VERSION_TALLA", valor = stock inicial
  function getStock(versionSlug: string, sizeCode: string): number | null {
    const map: Record<string, Record<string, number | null>> = {
      fan: { S: 1, M: 4, L: 3, XL: 1, XXL: 0 },
      player: { S: 2, M: 6, L: 5, XL: 2, XXL: 1 },
      retro: { S: null, M: null, L: null, XL: null, XXL: null },
      training: { S: 1, M: 3, L: 2, XL: 1, XXL: 0 },
    };
    return map[versionSlug]?.[sizeCode] ?? null;
  }

  for (const p of productSeeds) {
    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        shortName: p.shortName,
        description: p.description,
        kitType: p.kitType,
        brand: p.brand,
        isFeatured: p.isFeatured ?? false,
        isActive: true,
        customizationsEnabled: p.customizationsEnabled ?? true,
        customizationSurcharge: 12000,
        hasPlayerPrint: p.hasPlayerPrint ?? false,
        teamId: p.teamId,
        seasonId: p.seasonId,
      },
    });

    // ProductImage
    await prisma.productImage.create({
      data: { productId: created.id, url: IMG.white, altText: p.name, order: 0, isPrimary: true },
    });

    // Variants
    for (const { version, suffix } of versionList) {
      for (const size of sizeList) {
        const salePrice = p.basePrice + version.priceAdjustment;
        const stock = getStock(version.slug, size.code);
        const availability = stock === null ? "ON_DEMAND" : stock === 0 ? "OUT_OF_STOCK" : "AVAILABLE";

        const variant = await prisma.productVariant.create({
          data: {
            productId: created.id,
            versionId: version.id,
            sizeId: size.id,
            sku: `${p.slug.toUpperCase()}-${suffix}-${size.code}`,
            costPrice: Math.round(salePrice * 0.45),
            salePrice,
            compareAtPrice: Math.random() > 0.6 ? Math.round(salePrice * 1.25) : null,
            lowStockAt: 2,
            weight: version.slug === "player" ? 350 : 400,
          },
        });

        // Inventory movement for initial stock
        if (stock !== null && stock > 0) {
          await prisma.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "IN",
              quantity: stock,
              reference: "INITIAL",
              reason: "Inventario inicial",
            },
          });
        }
      }
    }

    // Supplier products
    const supCostMultiplier = Math.random();
    await prisma.supplierProduct.create({
      data: {
        supplierId: supA.id, productId: created.id,
        costPrice: Math.round(p.basePrice * 0.45), isAvailable: true,
        notes: "Stock habitual. MOQ 10 uds.",
      },
    });
    await prisma.supplierProduct.create({
      data: {
        supplierId: supB.id, productId: created.id,
        costPrice: Math.round(p.basePrice * 0.50), isAvailable: Math.random() > 0.2,
      },
    });
    await prisma.supplierProduct.create({
      data: {
        supplierId: supC.id, productId: created.id,
        costPrice: Math.round(p.basePrice * 0.55), isAvailable: Math.random() > 0.5,
        notes: "Solo pedidos premium.",
      },
    });
  }

  // ── Admin user + customer ──
  const adminUser = await prisma.user.create({
    data: { email: "admin@footballstore.co", name: "Administrador", role: "ADMIN", isActive: true },
  });
  await prisma.customer.create({
    data: { email: "admin@footballstore.co", name: "Administrador", userId: adminUser.id },
  });

  // ── Sample guest customer ──
  await prisma.customer.create({
    data: { email: "cliente@example.com", name: "Juan Pérez", phone: "3001234567" },
  });

  // ── Settings ──
  await prisma.setting.createMany({
    data: [
      { key: "store_name", value: SITE.name },
      { key: "store_email", value: SITE.email },
      { key: "store_phone", value: SITE.whatsappNumber },
      { key: "currency", value: "COP" },
      { key: "shipping_free_threshold", value: "200000" },
      { key: "shipping_base_fee", value: "12000" },
      { key: "personalization_fee", value: "12000" },
    ],
  });

  // ── Stats ──
  const stats = {
    versions: await prisma.version.count(),
    sizes: await prisma.size.count(),
    leagues: await prisma.league.count(),
    teams: await prisma.team.count(),
    seasons: await prisma.season.count(),
    suppliers: await prisma.supplier.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    movements: await prisma.inventoryMovement.count(),
    customers: await prisma.customer.count(),
    users: await prisma.user.count(),
  };

  console.log(`✅ Seed completado:
  ${stats.versions} versiones
  ${stats.sizes} tallas
  ${stats.leagues} ligas
  ${stats.teams} equipos
  ${stats.seasons} temporadas
  ${stats.suppliers} proveedores
  ${stats.products} productos
  ${stats.variants} variantes
  ${stats.movements} movimientos de inventario
  ${stats.customers} clientes
  ${stats.users} usuarios`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
