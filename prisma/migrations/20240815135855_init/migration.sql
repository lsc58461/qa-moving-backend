-- CreateEnum
CREATE TYPE "UserTypes" AS ENUM ('CUSTOMER', 'MOVER');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('SMALL', 'HOME', 'OFFICE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ESTIMATE', 'CONFIRMED', 'MOVINGDAY');

-- CreateTable
CREATE TABLE "UserInfo" (
    "id" TEXT NOT NULL,
    "userTypes" "UserTypes" NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "password" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "Mover" (
    "moverId" TEXT NOT NULL,
    "career" TEXT,
    "confirmedCount" INTEGER,
    "serviceArea" TEXT,
    "serviceType" "ServiceType",
    "onLineIntroduction" TEXT,
    "detailDescription" TEXT,
    "serviceableArea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mover_pkey" PRIMARY KEY ("moverId")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovingInfo" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "movingType" "ServiceType" NOT NULL,
    "movingDate" TIMESTAMP(3) NOT NULL,
    "startAddress" TEXT NOT NULL,
    "endAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateRequest" (
    "movingInfoId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "isDesignated" BOOLEAN NOT NULL DEFAULT false,
    "estimateCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateRequest_pkey" PRIMARY KEY ("movingInfoId")
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL,
    "movingInfoId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "reviewId" TEXT,
    "price" INTEGER NOT NULL,
    "comment" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "movingInfoId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserInfo_email_key" ON "UserInfo"("email");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "Mover"("moverId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovingInfo" ADD CONSTRAINT "MovingInfo_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateRequest" ADD CONSTRAINT "EstimateRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_movingInfoId_fkey" FOREIGN KEY ("movingInfoId") REFERENCES "MovingInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "Mover"("moverId") ON DELETE RESTRICT ON UPDATE CASCADE;
