/*
  Warnings:

  - You are about to drop the column `Avatarid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `Role` on the `User` table. All the data in the column will be lost.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_Avatarid_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "Avatarid",
DROP COLUMN "Role",
ADD COLUMN     "avatarid" TEXT,
ADD COLUMN     "role" "Role" NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarid_fkey" FOREIGN KEY ("avatarid") REFERENCES "Avatars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
