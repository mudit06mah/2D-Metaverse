/*
  Warnings:

  - You are about to drop the column `avatarImg` on the `Avatars` table. All the data in the column will be lost.
  - Added the required column `avatarIdle` to the `Avatars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avatarRun` to the `Avatars` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Avatars" DROP COLUMN "avatarImg",
ADD COLUMN     "avatarIdle" TEXT NOT NULL,
ADD COLUMN     "avatarRun" TEXT NOT NULL;
