/*
  Warnings:

  - You are about to drop the column `estimateCount` on the `EstimateRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EstimateRequest" DROP COLUMN "estimateCount";

-- AlterTable
ALTER TABLE "MovingInfo" ADD COLUMN     "designatedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimateCount" INTEGER NOT NULL DEFAULT 0;
