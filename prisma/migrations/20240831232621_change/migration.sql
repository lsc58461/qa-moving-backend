-- AlterTable
ALTER TABLE "Estimate" ALTER COLUMN "isConfirmed" DROP NOT NULL,
ALTER COLUMN "isConfirmed" DROP DEFAULT;
