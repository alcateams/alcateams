-- CreateEnum
CREATE TYPE "SubGroupKind" AS ENUM ('GENERAL', 'THEMATIC');

-- CreateEnum
CREATE TYPE "RainbowSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "SubGroup" ADD COLUMN     "kind" "SubGroupKind" NOT NULL DEFAULT 'THEMATIC';

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "subGroupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rainbowMessageId" TEXT,
    "rainbowSyncStatus" "RainbowSyncStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_subGroupId_createdAt_idx" ON "Message"("subGroupId", "createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_subGroupId_fkey" FOREIGN KEY ("subGroupId") REFERENCES "SubGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

