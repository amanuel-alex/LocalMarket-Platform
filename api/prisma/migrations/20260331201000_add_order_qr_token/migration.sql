-- AlterTable
ALTER TABLE "Order" ADD COLUMN "qrToken" TEXT;
ALTER TABLE "Order" ADD COLUMN "qrConsumedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Order_qrToken_key" ON "Order"("qrToken");
