/*
  Warnings:

  - Added the required column `serviceableArea` to the `MovingInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MovingInfo" ADD COLUMN     "serviceableArea" "ServiceableArea" NOT NULL;
