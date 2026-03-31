-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'am', 'om');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferredLocale" "Locale" NOT NULL DEFAULT 'en';
