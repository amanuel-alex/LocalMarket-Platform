-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryConfirmedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "escrowReleasedAt" TIMESTAMP(3);
