/*
  Warnings:

  - Added the required column `passwordKey` to the `FranchiseManager` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordKey` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordKey` to the `SuperAdmin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FranchiseManager" ADD COLUMN     "passwordKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "passwordKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SuperAdmin" ADD COLUMN     "passwordKey" TEXT NOT NULL;
