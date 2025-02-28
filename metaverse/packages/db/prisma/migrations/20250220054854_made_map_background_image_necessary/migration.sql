/*
  Warnings:

  - Made the column `bgImg` on table `Maps` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Maps" ALTER COLUMN "bgImg" SET NOT NULL;
