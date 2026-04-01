/*
  Warnings:

  - You are about to drop the column `metadata` on the `Document` table. All the data in the column will be lost.
  - The `documentType` column on the `Document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `fileName` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `originalName` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mimeType` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `size` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filePath` on table `Document` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "metadata",
ADD COLUMN     "documentLabel" TEXT,
ALTER COLUMN "fileName" SET NOT NULL,
ALTER COLUMN "originalName" SET NOT NULL,
ALTER COLUMN "mimeType" SET NOT NULL,
ALTER COLUMN "size" SET NOT NULL,
ALTER COLUMN "filePath" SET NOT NULL,
DROP COLUMN "documentType",
ADD COLUMN     "documentType" TEXT;

-- DropEnum
DROP TYPE "DocumentType";

-- CreateTable
CREATE TABLE "DocumentShare" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "maskedNumber" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
