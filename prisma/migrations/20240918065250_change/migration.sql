-- DropForeignKey
ALTER TABLE "ServiceType" DROP CONSTRAINT "ServiceType_moverId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceableArea" DROP CONSTRAINT "ServiceableArea_moverId_fkey";

-- AlterTable
ALTER TABLE "ServiceType" ADD COLUMN     "customerCustomerId" TEXT,
ALTER COLUMN "moverId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ServiceableArea" ADD COLUMN     "customerCustomerId" TEXT,
ALTER COLUMN "moverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ServiceType" ADD CONSTRAINT "ServiceType_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "Mover"("moverId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceType" ADD CONSTRAINT "ServiceType_customerCustomerId_fkey" FOREIGN KEY ("customerCustomerId") REFERENCES "Customer"("customerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceableArea" ADD CONSTRAINT "ServiceableArea_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "Mover"("moverId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceableArea" ADD CONSTRAINT "ServiceableArea_customerCustomerId_fkey" FOREIGN KEY ("customerCustomerId") REFERENCES "Customer"("customerId") ON DELETE SET NULL ON UPDATE CASCADE;
