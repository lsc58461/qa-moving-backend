/*
  Warnings:

  - You are about to drop the column `userTypes` on the `UserInfo` table. All the data in the column will be lost.
  - Added the required column `userType` to the `UserInfo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CUSTOMER', 'MOVER');

-- AlterTable
ALTER TABLE "UserInfo" DROP COLUMN "userTypes",
ADD COLUMN     "userType" "UserType" NOT NULL;

-- DropEnum
DROP TYPE "UserTypes";
