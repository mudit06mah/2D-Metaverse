/*
  Warnings:

  - You are about to drop the `Avatar` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `Elements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `static` to the `Elements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `Maps` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_Avatarid_fkey";

-- AlterTable
ALTER TABLE "Elements" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "static" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Maps" ADD COLUMN     "thumbnail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "Avatarid" DROP NOT NULL;

-- DropTable
DROP TABLE "Avatar";

-- CreateTable
CREATE TABLE "Avatars" (
    "id" TEXT NOT NULL,
    "avatarImg" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Avatars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Avatars_id_key" ON "Avatars"("id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_Avatarid_fkey" FOREIGN KEY ("Avatarid") REFERENCES "Avatars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
