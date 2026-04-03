-- Email + application narrative + proposal document URL for seller / delivery signup
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "applicationAbout" TEXT;
ALTER TABLE "User" ADD COLUMN "applicationProposalUrl" TEXT;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
