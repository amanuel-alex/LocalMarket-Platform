-- Default platform commission: 5% (500 bps).
ALTER TABLE "platform_settings" ALTER COLUMN "commissionRateBps" SET DEFAULT 500;
UPDATE "platform_settings" SET "commissionRateBps" = 500 WHERE "id" = 1 AND "commissionRateBps" = 0;
