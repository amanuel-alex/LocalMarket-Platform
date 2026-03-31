-- Composite index for buyer order lists ordered by newest first.
CREATE INDEX "Order_buyerId_createdAt_idx" ON "Order"("buyerId", "createdAt" DESC);
-- Covered by the composite index above.
DROP INDEX IF EXISTS "Order_buyerId_idx";
