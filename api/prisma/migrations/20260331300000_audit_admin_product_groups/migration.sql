-- PlatformSettings (singleton row id = 1)
CREATE TABLE "platform_settings" (
    "id" INTEGER NOT NULL,
    "commissionRateBps" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "platform_settings_commission_ck" CHECK ("commissionRateBps" >= 0 AND "commissionRateBps" <= 10000)
);

INSERT INTO "platform_settings" ("id", "commissionRateBps", "updatedAt") VALUES (1, 0, CURRENT_TIMESTAMP);

-- ProductGroup
CREATE TABLE "product_groups" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- User ban
ALTER TABLE "User" ADD COLUMN "bannedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "banReason" TEXT;

CREATE INDEX "User_bannedAt_idx" ON "User"("bannedAt");

-- Product normalization
ALTER TABLE "Product" ADD COLUMN "product_group_id" TEXT;

CREATE INDEX "Product_product_group_id_idx" ON "Product"("product_group_id");

ALTER TABLE "Product" ADD CONSTRAINT "Product_product_group_id_fkey" FOREIGN KEY ("product_group_id") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Order admin audit fields
ALTER TABLE "Order" ADD COLUMN "adminOverrideNote" TEXT;
ALTER TABLE "Order" ADD COLUMN "adminOverriddenAt" TIMESTAMP(3);

-- Audit log
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "note" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
