/*
  Warnings:

  - You are about to drop the `EstimateRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EstimateRequest" DROP CONSTRAINT "EstimateRequest_customerId_fkey";

-- DropTable
DROP TABLE "EstimateRequest";

-- CreateTable
CREATE TABLE "DesignatedEstimateRequest" (
    "id" TEXT NOT NULL,
    "movingInfoId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignatedEstimateRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DesignatedEstimateRequest" ADD CONSTRAINT "DesignatedEstimateRequest_movingInfoId_fkey" FOREIGN KEY ("movingInfoId") REFERENCES "MovingInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignatedEstimateRequest" ADD CONSTRAINT "DesignatedEstimateRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignatedEstimateRequest" ADD CONSTRAINT "DesignatedEstimateRequest_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "Mover"("moverId") ON DELETE RESTRICT ON UPDATE CASCADE;
