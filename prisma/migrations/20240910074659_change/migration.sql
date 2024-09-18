/*
  Warnings:

  - The `career` column on the `Mover` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Mover" DROP COLUMN "career",
ADD COLUMN     "career" INTEGER;
