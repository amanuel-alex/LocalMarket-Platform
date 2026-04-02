-- New inventory columns (backfill from legacy stockQuantity + open orders)
ALTER TABLE "Product" ADD COLUMN "quantity" INTEGER;
ALTER TABLE "Product" ADD COLUMN "sold" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "isSoldOut" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product" p
SET "sold" = COALESCE(
  (
    SELECT SUM(o."quantity")::integer
    FROM "Order" o
    WHERE o."productId" = p.id
      AND o.status <> 'cancelled'
  ),
  0
);

UPDATE "Product"
SET "quantity" = GREATEST(0, "stockQuantity" + "sold");

UPDATE "Product"
SET "isSoldOut" = CASE
  WHEN "quantity" <= 0 THEN true
  WHEN "sold" >= "quantity" THEN true
  ELSE false
END;

ALTER TABLE "Product" ALTER COLUMN "quantity" SET NOT NULL;

ALTER TABLE "Product" DROP COLUMN "stockQuantity";
