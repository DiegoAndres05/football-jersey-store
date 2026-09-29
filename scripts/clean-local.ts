import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_EMAIL = "admin@footballstore.co";

async function main() {
  console.log("🧹 Limpiando datos locales sin cargar datos demo...");

  await prisma.inventoryMovement.deleteMany();
  await prisma.notificationAttempt.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.legalConsentSnapshot.deleteMany();
  await prisma.shippingRuleSnapshot.deleteMany();
  await prisma.boldTransaction.deleteMany();
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
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany({ where: { email: { not: ADMIN_EMAIL } } });
  await prisma.setting.deleteMany();

  const admin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { email: true, role: true },
  });

  console.log("✅ Datos locales eliminados.");
  console.log(
    admin
      ? `✅ Usuario admin conservado: ${admin.email} (${admin.role})`
      : "⚠️ No existe el usuario admin; no se creó ningún usuario nuevo.",
  );
}

main()
  .catch((error) => {
    console.error("❌ Error limpiando datos locales:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
