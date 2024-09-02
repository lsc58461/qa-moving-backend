/*
  Warnings:

  - You are about to drop the column `serviceType` on the `Mover` table. All the data in the column will be lost.
  - You are about to drop the column `movingType` on the `MovingInfo` table. All the data in the column will be lost.
  - Added the required column `serviceTypeId` to the `MovingInfo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceTypes" AS ENUM ('SMALL', 'HOME', 'OFFICE');

-- AlterTable
ALTER TABLE "Mover" DROP COLUMN "serviceType";

-- AlterTable
ALTER TABLE "MovingInfo" DROP COLUMN "movingType",
ADD COLUMN     "serviceTypeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ServiceType";

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "type" "ServiceTypes" NOT NULL,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceType" ADD CONSTRAINT "ServiceType_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "Mover"("moverId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovingInfo" ADD CONSTRAINT "MovingInfo_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
