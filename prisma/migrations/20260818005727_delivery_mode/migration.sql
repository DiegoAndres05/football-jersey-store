-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "deliveryMode" TEXT NOT NULL DEFAULT 'INMEDIATA';

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "allowsBackorder" BOOLEAN NOT NULL DEFAULT true;
