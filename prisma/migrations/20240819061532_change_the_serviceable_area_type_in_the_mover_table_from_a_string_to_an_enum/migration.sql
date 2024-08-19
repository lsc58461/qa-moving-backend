/*
  Warnings:

  - The `serviceableArea` column on the `Mover` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ServiceableArea" AS ENUM ('SEOUL', 'GYEINGGI', 'INCHEON', 'GANGWON', 'CHUNGBUK', 'CHUNGNAM', 'SEJONG', 'DAEJEON', 'JEONBUK', 'JEONNAM', 'GWANGJU', 'GYEONGBUK', 'GYEONGNAM', 'DAEGU', 'ULSAN', 'BUSAN', 'JEJU');

-- AlterTable
ALTER TABLE "Mover" DROP COLUMN "serviceableArea",
ADD COLUMN     "serviceableArea" "ServiceableArea";
