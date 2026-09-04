import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const BUCKET = "product-images";

async function main() {
  console.log("🧹 Limpiando catálogo de productos...\n");

  // ── Supabase client (service role) ──
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── 1. Obtener imágenes de Storage a borrar ──
  const images = await prisma.productImage.findMany({
    where: { storagePath: { not: null } },
    select: { id: true, storagePath: true },
  });
  console.log(`📦 Imágenes con archivos en Storage: ${images.length}`);

  // ── 2. Borrar archivos de Supabase Storage ──
  if (images.length > 0) {
    const paths = images.map((i) => i.storagePath!);
    // Borrar en lotes de 50 (límite de Supabase)
    for (let i = 0; i < paths.length; i += 50) {
      const batch = paths.slice(i, i + 50);
      const { error } = await supabase.storage.from(BUCKET).remove(batch);
      if (error) {
        console.error(`⚠️  Error al borrar lote de Storage: ${error.message}`);
      } else {
        console.log(`   ✅ Borrados ${batch.length} archivos de Storage`);
      }
    }
  }

  // ── 3. Contar registros antes de borrar ──
  const [products, variants, productImages, movements, supplierProducts] =
    await Promise.all([
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.productImage.count(),
      prisma.inventoryMovement.count(),
      prisma.supplierProduct.count(),
    ]);

  console.log("\n📊 Registros encontrados:");
  console.log(`   Products:           ${products}`);
  console.log(`   ProductVariant:     ${variants}`);
  console.log(`   ProductImage:       ${productImages}`);
  console.log(`   InventoryMovement:  ${movements}`);
  console.log(`   SupplierProduct:    ${supplierProducts}`);

  // ── 4. Eliminar en orden correcto ──
  console.log("\n🗑️  Eliminando...");

  const deletedMovements = await prisma.inventoryMovement.deleteMany();
  console.log(`   ✅ InventoryMovement: ${deletedMovements.count} eliminados`);

  const deletedImages = await prisma.productImage.deleteMany();
  console.log(`   ✅ ProductImage:      ${deletedImages.count} eliminados`);

  const deletedVariants = await prisma.productVariant.deleteMany();
  console.log(`   ✅ ProductVariant:    ${deletedVariants.count} eliminados`);

  const deletedSupplierProducts = await prisma.supplierProduct.deleteMany();
  console.log(`   ✅ SupplierProduct:   ${deletedSupplierProducts.count} eliminados`);

  const deletedProducts = await prisma.product.deleteMany();
  console.log(`   ✅ Product:           ${deletedProducts.count} eliminados`);

  // ── 5. Verificar datos de referencia ──
  console.log("\n🔍 Verificando datos de referencia (deben conservarse):");

  const [leagues, teams, seasons, versions, sizes, suppliers, users] =
    await Promise.all([
      prisma.league.count(),
      prisma.team.count(),
      prisma.season.count(),
      prisma.version.count(),
      prisma.size.count(),
      prisma.supplier.count(),
      prisma.user.count(),
    ]);

  console.log(`   Leagues:   ${leagues}`);
  console.log(`   Teams:     ${teams}`);
  console.log(`   Seasons:   ${seasons}`);
  console.log(`   Versions:  ${versions}`);
  console.log(`   Sizes:     ${sizes}`);
  console.log(`   Suppliers: ${suppliers}`);
  console.log(`   Users:     ${users}`);

  console.log("\n✅ Catálogo limpio. La tienda está lista para importar productos nuevos.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
