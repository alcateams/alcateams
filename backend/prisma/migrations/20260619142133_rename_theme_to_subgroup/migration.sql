/*
  Warnings:

  - You are about to drop the `Theme` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Theme" DROP CONSTRAINT "Theme_communityId_fkey";

-- DropTable
DROP TABLE "Theme";

-- CreateTable
CREATE TABLE "SubGroup" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "rainbowBubbleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubGroup_rainbowBubbleId_key" ON "SubGroup"("rainbowBubbleId");

-- CreateIndex
CREATE UNIQUE INDEX "SubGroup_communityId_name_key" ON "SubGroup"("communityId", "name");

-- AddForeignKey
ALTER TABLE "SubGroup" ADD CONSTRAINT "SubGroup_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
