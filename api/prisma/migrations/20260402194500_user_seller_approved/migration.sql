-- Seller self-signup requires admin approval; existing sellers keep full access.
ALTER TABLE "User" ADD COLUMN "sellerApproved" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "sellerApproved" = true WHERE role = 'seller';
