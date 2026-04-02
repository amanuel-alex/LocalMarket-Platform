-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'cancelled';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 0;

UPDATE "Product" SET "stockQuantity" = 100 WHERE "stockQuantity" = 0;
