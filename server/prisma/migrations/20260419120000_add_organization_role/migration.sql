-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ORGANIZATION';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "apiKey" TEXT;
ALTER TABLE "User" ADD COLUMN "apiKeyIssuedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKey_key" ON "User"("apiKey");

-- CreateTable
CREATE TABLE "OrgVerification" (
    "id" TEXT NOT NULL,
    "orgUserId" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "queriedName" TEXT NOT NULL,
    "queriedPhone" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgVerification_orgUserId_createdAt_idx" ON "OrgVerification"("orgUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrgVerification" ADD CONSTRAINT "OrgVerification_orgUserId_fkey" FOREIGN KEY ("orgUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgVerification" ADD CONSTRAINT "OrgVerification_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
