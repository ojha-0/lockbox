-- AlterTable
ALTER TABLE "DocumentShare"
  ADD COLUMN "fullAccessStatus" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "fullAccessRequestedAt" TIMESTAMP(3),
  ADD COLUMN "fullAccessRespondedAt" TIMESTAMP(3);
