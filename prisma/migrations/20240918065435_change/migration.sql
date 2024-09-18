/*
  Warnings:

  - You are about to drop the column `customerCustomerId` on the `ServiceType` table. All the data in the column will be lost.
  - You are about to drop the column `customerCustomerId` on the `ServiceableArea` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceType" DROP CONSTRAINT "ServiceType_customerCustomerId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceableArea" DROP CONSTRAINT "ServiceableArea_customerCustomerId_fkey";

-- AlterTable
ALTER TABLE "ServiceType" DROP COLUMN "customerCustomerId",
ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "ServiceableArea" DROP COLUMN "customerCustomerId",
ADD COLUMN     "customerId" TEXT;

-- AddForeignKey
ALTER TABLE "ServiceType" ADD CONSTRAINT "ServiceType_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceableArea" ADD CONSTRAINT "ServiceableArea_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE SET NULL ON UPDATE CASCADE;
