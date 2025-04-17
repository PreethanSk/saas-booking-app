/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `FranchiseManager` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `FranchiseManager` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FranchiseManager" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseManager_username_key" ON "FranchiseManager"("username");
