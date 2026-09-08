import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Limpiando pedidos y clientes de prueba...\n");

  // 1. Contar registros antes de borrar
  const [orders, items, history, notifications, movements, customers] =
    await Promise.all([
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.orderStatusHistory.count(),
      prisma.notificationAttempt.count(),
      prisma.inventoryMovement.count(),
      prisma.customer.count(),
    ]);

  console.log("📊 Registros encontrados:");
  console.log(`   Orders:              ${orders}`);
  console.log(`   OrderItem:           ${items}`);
  console.log(`   OrderStatusHistory:  ${history}`);
  console.log(`   NotificationAttempt: ${notifications}`);
  console.log(`   InventoryMovement:   ${movements}`);
  console.log(`   Customer:            ${customers}`);

  if (orders === 0 && customers === 0) {
    console.log("\n✅ No hay pedidos ni clientes que borrar.");
    return;
  }

  // 2. Borrar en orden correcto (respetar foreign keys)
  console.log("\n🗑️  Eliminando...");

  // NotificationAttempt tiene onDelete: Restrict — debe ir primero
  const n = await prisma.notificationAttempt.deleteMany();
  console.log(`   ✅ NotificationAttempt: ${n.count} eliminados`);

  // InventoryMovement referencia por campo text (orderReference), no FK
  const m = await prisma.inventoryMovement.deleteMany();
  console.log(`   ✅ InventoryMovement: ${m.count} eliminados`);

  const h = await prisma.orderStatusHistory.deleteMany();
  console.log(`   ✅ OrderStatusHistory: ${h.count} eliminados`);

  const i = await prisma.orderItem.deleteMany();
  console.log(`   ✅ OrderItem: ${i.count} eliminados`);

  const o = await prisma.order.deleteMany();
  console.log(`   ✅ Order: ${o.count} eliminados`);

  const c = await prisma.customer.deleteMany();
  console.log(`   ✅ Customer: ${c.count} eliminados`);

  // 3. Verificar datos de referencia que se conservan
  console.log("\n🔍 Verificando datos conservados:");
  const [products, variants, leagues, teams, users] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.league.count(),
    prisma.team.count(),
    prisma.user.count(),
  ]);
  console.log(`   Products:    ${products}`);
  console.log(`   Variants:    ${variants}`);
  console.log(`   Leagues:     ${leagues}`);
  console.log(`   Teams:       ${teams}`);
  console.log(`   Users:       ${users}`);

  console.log("\n✅ Limpieza completa. La tienda está lista para nuevos pedidos.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
