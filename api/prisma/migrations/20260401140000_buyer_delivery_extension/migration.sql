-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'blocked');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'assigned', 'picked', 'delivered');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'delivery_agent';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryAgentApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryAgentActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "readyForPickupAt" TIMESTAMP(3);

-- Align lifecycle flags with existing bans
UPDATE "User" SET "status" = 'blocked' WHERE "bannedAt" IS NOT NULL;

-- Existing logistics accounts keep access after this rollout
UPDATE "User"
SET "deliveryAgentApproved" = true,
    "deliveryAgentActive" = true
WHERE "role" = 'delivery';

UPDATE "Order" SET "deliveryStatus" = 'assigned' WHERE "deliveryAgentId" IS NOT NULL AND "deliveryStartedAt" IS NULL;

UPDATE "Order" SET "deliveryStatus" = 'picked' WHERE "deliveryStartedAt" IS NOT NULL;
