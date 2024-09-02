/*
  Warnings:

  - You are about to drop the column `onLineIntroduction` on the `Mover` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mover" DROP COLUMN "onLineIntroduction",
ADD COLUMN     "oneLineIntroduction" TEXT;
