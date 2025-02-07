/*
  Warnings:

  - Made the column `elementImg` on table `Elements` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Elements" ALTER COLUMN "elementImg" SET NOT NULL,
ALTER COLUMN "elementImg" SET DATA TYPE TEXT;
