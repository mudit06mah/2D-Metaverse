/*
  Warnings:

  - You are about to drop the column `avatarid` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_avatarid_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarid",
ADD COLUMN     "avatarId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
