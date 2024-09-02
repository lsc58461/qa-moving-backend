/*
  Warnings:

  - You are about to drop the column `serviceTypeId` on the `MovingInfo` table. All the data in the column will be lost.
  - You are about to drop the column `serviceableAreaId` on the `MovingInfo` table. All the data in the column will be lost.
  - Added the required column `movingType` to the `MovingInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceableArea` to the `MovingInfo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MovingInfo" DROP CONSTRAINT "MovingInfo_serviceTypeId_fkey";

-- DropForeignKey
ALTER TABLE "MovingInfo" DROP CONSTRAINT "MovingInfo_serviceableAreaId_fkey";

-- AlterTable
ALTER TABLE "MovingInfo" DROP COLUMN "serviceTypeId",
DROP COLUMN "serviceableAreaId",
ADD COLUMN     "movingType" "ServiceTypes" NOT NULL,
ADD COLUMN     "serviceableArea" "ServiceableAreas" NOT NULL;
