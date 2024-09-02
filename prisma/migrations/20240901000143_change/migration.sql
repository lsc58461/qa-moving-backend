/*
  Warnings:

  - You are about to drop the column `serviceableArea` on the `Mover` table. All the data in the column will be lost.
  - You are about to drop the column `serviceableArea` on the `MovingInfo` table. All the data in the column will be lost.
  - Added the required column `serviceableAreaId` to the `MovingInfo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceableAreas" AS ENUM ('SEOUL', 'GYEINGGI', 'INCHEON', 'GANGWON', 'CHUNGBUK', 'CHUNGNAM', 'SEJONG', 'DAEJEON', 'JEONBUK', 'JEONNAM', 'GWANGJU', 'GYEONGBUK', 'GYEONGNAM', 'DAEGU', 'ULSAN', 'BUSAN', 'JEJU');

-- AlterTable
ALTER TABLE "Mover" DROP COLUMN "serviceableArea";

-- AlterTable
ALTER TABLE "MovingInfo" DROP COLUMN "serviceableArea",
ADD COLUMN     "serviceableAreaId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ServiceableArea";

-- CreateTable
CREATE TABLE "ServiceableArea" (
    "id" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "area" "ServiceableAreas" NOT NULL,

    CONSTRAINT "ServiceableArea_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceableArea" ADD CONSTRAINT "ServiceableArea_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "Mover"("moverId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovingInfo" ADD CONSTRAINT "MovingInfo_serviceableAreaId_fkey" FOREIGN KEY ("serviceableAreaId") REFERENCES "ServiceableArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
