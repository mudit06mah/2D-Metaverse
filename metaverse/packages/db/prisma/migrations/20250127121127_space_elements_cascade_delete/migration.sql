-- DropForeignKey
ALTER TABLE "MapElements" DROP CONSTRAINT "MapElements_mapId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceElements" DROP CONSTRAINT "SpaceElements_spaceId_fkey";

-- AddForeignKey
ALTER TABLE "MapElements" ADD CONSTRAINT "MapElements_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceElements" ADD CONSTRAINT "SpaceElements_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
